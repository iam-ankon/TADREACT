import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUsers,
  FiCalendar,
  FiMail,
  FiFileText,
  FiDollarSign,
  FiTerminal,
  FiSend,
  FiLogOut,
  FiPieChart,
  FiBriefcase,
  FiClock,
  FiHome,
  FiVoicemail,
  FiArrowUp,
  FiArrowDown,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock as FiClockIcon,
  FiGift,
  FiStar,
  FiActivity,
  FiUserCheck,
  FiUserX,
  FiAward,
  FiBarChart2,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getEmployees,
  getInterviews,
  getEmployeeLeaves,
  getCVs,
  getAttendance,
  getWeeklyAttendanceStats,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

// Move constants outside component
const PIE_COLORS = [
  "#667eea",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
];

const HOLIDAYS = [
  { date: "2026-02-04", name: "Shab-E-Barat", days: 1, day: "Wednesday" },
  {
    date: "2026-02-21",
    name: "Shahid Day & International Mother Language Day",
    days: 1,
    day: "Saturday",
  },
  { date: "2026-03-17", name: "Shab-E-Qadir", days: 1, day: "Tuesday" },
  { date: "2026-03-19", name: "Eid-ul-Fitr", days: 5, day: "Thursday" },
  {
    date: "2026-03-26",
    name: "Independence Day",
    days: 1,
    day: "Thursday",
  },
  {
    date: "2026-04-14",
    name: "Bangla Nababarsha",
    days: 1,
    day: "Tuesday",
  },
  {
    date: "2026-05-01",
    name: "May Day & Buddha Purnima",
    days: 1,
    day: "Friday",
  },
  { date: "2026-05-29", name: "Eid-Ul-Adha", days: 6, day: "Friday" },
  { date: "2026-06-26", name: "Ashura", days: 1, day: "Friday" },
  { date: "2026-09-04", name: "Janmashtami", days: 1, day: "Friday" },
  {
    date: "2026-10-21",
    name: "Durga Puja (Dashami)",
    days: 1,
    day: "Wednesday",
  },
  { date: "2026-12-16", name: "Victory Day", days: 1, day: "Wednesday" },
  {
    date: "2026-12-25",
    name: "Christmas & Year Ending Holidays",
    days: 4,
    day: "Friday",
  },
];

// Cache keys
const CACHE_KEYS = {
  EMPLOYEES: "hr_employees",
  LEAVES: "hr_leaves",
  CVS: "hr_cvs",
  INTERVIEWS: "hr_interviews",
  ATTENDANCE: "hr_attendance",
  WEEKLY_STATS: "hr_weekly_stats",
};

// Cache expiry (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Cache utility functions
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.warn("Failed to cache data:", error);
  }
};

// Format time helper
const formatTime = (timeString) => {
  if (!timeString) return "--:--";
  if (timeString.includes("T")) {
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return timeString;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid #f1f5f9",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: "5px 0 0 0" }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Loading skeleton component
const StatCardSkeleton = () => (
  <div
    style={{
      background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
      padding: "1.5rem",
      borderRadius: "1rem",
      height: "120px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        animation: "shimmer 1.5s infinite",
      }}
    />
  </div>
);

const HRWorkPage = () => {
  const navigate = useNavigate();

  // State management with cached defaults
  const [employeeCount, setEmployeeCount] = useState(() => {
    const cached = getCachedData(CACHE_KEYS.EMPLOYEES);
    return cached?.length || 0;
  });

  const [employeeData, setEmployeeData] = useState(() => {
    return getCachedData(CACHE_KEYS.EMPLOYEES) || [];
  });

  const [upcomingInterviews, setUpcomingInterviews] = useState(() => {
    return getCachedData(CACHE_KEYS.INTERVIEWS) || [];
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    return getCachedData(CACHE_KEYS.LEAVES) || [];
  });

  const [cvCount, setCvCount] = useState(() => {
    const cached = getCachedData(CACHE_KEYS.CVS);
    return cached?.length || 0;
  });

  const [attendanceData, setAttendanceData] = useState(() => {
    return getCachedData(CACHE_KEYS.ATTENDANCE) || [];
  });

  // State for weekly stats from API (accurate data)
  const [weeklyStatsData, setWeeklyStatsData] = useState(() => {
    return getCachedData(CACHE_KEYS.WEEKLY_STATS) || null;
  });

  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedChart, setSelectedChart] = useState("leave");

  // Loading states for progressive loading
  const [loadingStates, setLoadingStates] = useState({
    quickStats:
      !getCachedData(CACHE_KEYS.LEAVES) ||
      !getCachedData(CACHE_KEYS.CVS) ||
      !getCachedData(CACHE_KEYS.INTERVIEWS),
    employees: !getCachedData(CACHE_KEYS.EMPLOYEES),
    attendance: !getCachedData(CACHE_KEYS.ATTENDANCE),
    weeklyStats: !getCachedData(CACHE_KEYS.WEEKLY_STATS),
    details:
      !getCachedData(CACHE_KEYS.ATTENDANCE) ||
      !getCachedData(CACHE_KEYS.EMPLOYEES),
  });

  // Load holidays instantly (static data)
  useEffect(() => {
    const fetchUpcomingHolidays = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = HOLIDAYS.filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate >= today;
      })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

      setUpcomingHolidays(upcoming);
    };
    fetchUpcomingHolidays();
  }, []);

  // Load data progressively with caching
  useEffect(() => {
    let isMounted = true;

    const loadDataProgressively = async () => {
      try {
        // PHASE 1: Load quick stats (Leaves, CVs, Interviews) - fetch ALL pages
        if (loadingStates.quickStats) {
          console.log("Phase 1: Loading all quick stats data...");

          const [leavesRes, cvsRes, interviewsRes] = await Promise.allSettled([
            getEmployeeLeaves(1, 100, true),
            getCVs(1, 100, true),
            getInterviews(1, 100, true),
          ]);

          if (!isMounted) return;

          if (leavesRes.status === "fulfilled") {
            let leaves = [];
            if (Array.isArray(leavesRes.value.data)) {
              leaves = leavesRes.value.data;
            } else if (leavesRes.value.data && leavesRes.value.data.results) {
              leaves = leavesRes.value.data.results;
            }

            setCachedData(CACHE_KEYS.LEAVES, leaves);
            const sortedRequests = leaves.sort(
              (a, b) => new Date(b.start_date) - new Date(a.start_date),
            );
            setLeaveRequests(sortedRequests);
          }

          if (cvsRes.status === "fulfilled") {
            let cvs = [];
            if (Array.isArray(cvsRes.value.data)) {
              cvs = cvsRes.value.data;
            } else if (cvsRes.value.data && cvsRes.value.data.results) {
              cvs = cvsRes.value.data.results;
            }

            setCachedData(CACHE_KEYS.CVS, cvs);
            setCvCount(cvs.length || 0);
          }

          if (interviewsRes.status === "fulfilled") {
            let interviews = [];
            if (Array.isArray(interviewsRes.value.data)) {
              interviews = interviewsRes.value.data;
            } else if (
              interviewsRes.value.data &&
              interviewsRes.value.data.results
            ) {
              interviews = interviewsRes.value.data.results;
            }

            setCachedData(CACHE_KEYS.INTERVIEWS, interviews);
            const sortedInterviews = interviews
              .map((interview) => ({
                ...interview,
                displayTime: interview.time
                  ? formatTime(interview.time)
                  : "--:--",
              }))
              .sort(
                (a, b) =>
                  new Date(b.interview_date) - new Date(a.interview_date),
              );
            setUpcomingInterviews(sortedInterviews);
          }

          setLoadingStates((prev) => ({ ...prev, quickStats: false }));
        }

        // PHASE 2: Load employee data
        if (loadingStates.employees) {
          console.log("Phase 2: Loading all employee data...");
          const employeesRes = await getEmployees(1, 100, true);

          if (!isMounted) return;

          let employees = [];
          if (employeesRes.data && Array.isArray(employeesRes.data)) {
            employees = employeesRes.data;
          } else if (employeesRes.data && employeesRes.data.results) {
            employees = employeesRes.data.results;
          }

          setCachedData(CACHE_KEYS.EMPLOYEES, employees);
          setEmployeeCount(employees.length || 0);
          setEmployeeData(employees);

          setLoadingStates((prev) => ({ ...prev, employees: false }));
        }

        // PHASE 3: Load weekly stats from API (ACCURATE DATA including today)
        if (loadingStates.weeklyStats) {
          console.log("Phase 3: Loading weekly attendance stats from API...");

          try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 6);

            const startDateStr = startDate.toISOString().split("T")[0];
            const endDateStr = endDate.toISOString().split("T")[0];

            const response = await getWeeklyAttendanceStats(
              startDateStr,
              endDateStr,
            );

            if (response.data && response.data.daily_stats) {
              setCachedData(CACHE_KEYS.WEEKLY_STATS, response.data);
              setWeeklyStatsData(response.data);
              console.log("✅ Weekly stats loaded from API:", response.data);
            }
          } catch (error) {
            console.error("Error loading weekly stats:", error);
          }

          setLoadingStates((prev) => ({ ...prev, weeklyStats: false }));
        }

        // PHASE 4: Load attendance data (for today's list view only)
        if (loadingStates.attendance) {
          console.log("Phase 4: Loading all attendance data...");
          const attendanceRes = await getAttendance(1, 100, true);

          if (!isMounted) return;

          let attendance = [];
          if (attendanceRes.data && Array.isArray(attendanceRes.data)) {
            attendance = attendanceRes.data;
          } else if (attendanceRes.data && attendanceRes.data.results) {
            attendance = attendanceRes.data.results;
          }

          console.log(`✅ Loaded ${attendance.length} attendance records`);
          setCachedData(CACHE_KEYS.ATTENDANCE, attendance);
          setAttendanceData(attendance);

          setLoadingStates((prev) => ({
            ...prev,
            attendance: false,
            details: false,
          }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setLoadingStates({
          quickStats: false,
          employees: false,
          attendance: false,
          weeklyStats: false,
          details: false,
        });
      }
    };

    loadDataProgressively();

    return () => {
      isMounted = false;
    };
  }, [
    loadingStates.quickStats,
    loadingStates.employees,
    loadingStates.attendance,
    loadingStates.weeklyStats,
  ]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Get TODAY'S on-time data from the API (ACCURATE)
  const todaysApiData = useMemo(() => {
    if (!weeklyStatsData || !weeklyStatsData.daily_stats) {
      return null;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const todayData = weeklyStatsData.daily_stats.find(
      (day) => day.date === todayStr,
    );

    if (todayData) {
      return {
        onTimeCount: todayData.on_time_count,
        totalCount: todayData.total_attendance,
        percentage: todayData.on_time_percentage,
      };
    }
    return null;
  }, [weeklyStatsData]);

  // Calculate TODAY'S on-time percentage using API data (ACCURATE)
  const todaysOnTimePercentage = useMemo(() => {
    if (todaysApiData) {
      return `${todaysApiData.percentage}%`;
    }
    return "0%";
  }, [todaysApiData]);

  // Get today's on-time count and total for subtitle
  const todaysAttendanceStats = useMemo(() => {
    if (todaysApiData) {
      return {
        onTime: todaysApiData.onTimeCount,
        total: todaysApiData.totalCount,
      };
    }
    return { onTime: 0, total: 0 };
  }, [todaysApiData]);

  // Weekly data for bar chart from API (accurate)
  const weeklyChartData = useMemo(() => {
    if (weeklyStatsData && weeklyStatsData.daily_stats) {
      return weeklyStatsData.daily_stats.map((day) => ({
        day: day.day,
        onTime: day.on_time_count,
        late: day.late_count,
        percentage: day.on_time_percentage,
      }));
    }
    return [];
  }, [weeklyStatsData]);

  // Attendance analytics for pie chart and today's data display (using local data for display only)
  const attendanceAnalytics = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) {
      return {
        onTime: 0,
        late: 0,
        absent: 0,
        total: employeeCount,
        attendanceRate: 0,
        pieData: [],
        todayAttendance: [],
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendanceData.filter((record) => {
      if (!record.date) return false;
      const recordDate = new Date(record.date).toISOString().split("T")[0];
      return recordDate === today;
    });

    // For the pie chart, we use API data for accuracy if available
    let onTime = todaysApiData?.onTimeCount || 0;
    let late =
      (todaysApiData?.totalCount || 0) - (todaysApiData?.onTimeCount || 0);
    let absent = employeeCount - (todaysApiData?.totalCount || 0);

    const attendanceRate =
      employeeCount > 0
        ? Math.round(((employeeCount - absent) / employeeCount) * 100)
        : 0;

    const pieData = [
      { name: "On Time", value: onTime, color: "#10b981" },
      { name: "Late", value: late, color: "#f59e0b" },
      { name: "Absent", value: absent, color: "#ef4444" },
    ].filter((item) => item.value > 0);

    return {
      onTime,
      late,
      absent,
      total: employeeCount,
      attendanceRate,
      pieData,
      todayAttendance,
    };
  }, [attendanceData, employeeCount, todaysApiData]);

  const leaveAnalytics = useMemo(() => {
    const pending = leaveRequests.filter(
      (req) => req.status === "pending",
    ).length;
    const approved = leaveRequests.filter(
      (req) => req.status === "approved",
    ).length;
    const rejected = leaveRequests.filter(
      (req) => req.status === "rejected",
    ).length;
    const total = leaveRequests.length;

    const leaveTypes = {};
    leaveRequests.forEach((req) => {
      leaveTypes[req.leave_type] = (leaveTypes[req.leave_type] || 0) + 1;
    });

    const leaveTypeData = Object.entries(leaveTypes).map(
      ([name, value], index) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }),
    );

    const statusData = [
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "Approved", value: approved, color: "#10b981" },
      { name: "Rejected", value: rejected, color: "#ef4444" },
    ].filter((item) => item.value > 0);

    return {
      pending,
      approved,
      rejected,
      total,
      leaveTypeData,
      statusData,
    };
  }, [leaveRequests]);

  // Stats cards data - On-Time Arrivals now uses API data
  const stats = useMemo(
    () => [
      {
        title: "Total Employees",
        value: employeeCount,
        icon: <FiUsers size={24} />,
        link: "/employees",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        title: "On-Time Arrivals",
        value: todaysOnTimePercentage,
        icon: <FiClockIcon size={24} />,
        link: "/weekly-attendance-graph",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        subtitle:
          todaysAttendanceStats.total > 0
            ? `${todaysAttendanceStats.onTime} on-time out of ${todaysAttendanceStats.total} today`
            : "No attendance records today",
      },
      {
        title: "Attendance Rate",
        value: `${attendanceAnalytics.attendanceRate}%`,
        icon: <FiUserCheck size={24} />,
        link: "/attendance",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        subtitle: `Today: ${attendanceAnalytics.onTime} on time, ${attendanceAnalytics.late} late`,
      },
      {
        title: "Pending Leaves",
        value: leaveAnalytics.pending,
        icon: <FiCalendar size={24} />,
        link: "/employee_leave",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      },
      {
        title: "CV Bank",
        value: cvCount,
        icon: <FiFileText size={24} />,
        link: "/cv-list",
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      },
      {
        title: "Interviews",
        value: upcomingInterviews.length,
        icon: <FiBriefcase size={24} />,
        link: "/interviews",
        gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      },
    ],
    [
      employeeCount,
      todaysOnTimePercentage,
      todaysAttendanceStats,
      attendanceAnalytics,
      leaveAnalytics.pending,
      cvCount,
      upcomingInterviews.length,
    ],
  );

  const quickActions = useMemo(
    () => [
      {
        title: "Add Employee",
        icon: <FiUsers size={20} />,
        link: "/add-employee",
        color: "#667eea",
      },
      {
        title: "Schedule Interview",
        icon: <FiBriefcase size={20} />,
        link: "/interviews",
        color: "#ec4899",
      },
      {
        title: "Process Payroll",
        icon: <FiDollarSign size={20} />,
        link: "/finance-provision",
        color: "#8b5cf6",
      },
      {
        title: "Send Announcement",
        icon: <FiSend size={20} />,
        link: "/letter-send",
        color: "#10b981",
      },
      {
        title: "View Reports",
        icon: <FiBarChart2 size={20} />,
        link: "/weekly-attendance-graph",
        color: "#f59e0b",
      },
      {
        title: "Holiday Calendar",
        icon: <FiCalendar size={20} />,
        link: "/holidays",
        color: "#14b8a6",
      },
    ],
    [],
  );

  // Get today's attendance for display
  const todayAttendance = attendanceAnalytics.todayAttendance.slice(0, 3);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f0f2f5",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebars />

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 1.5rem" }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            borderRadius: "1rem",
            margin: "1.5rem 0",
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: 0,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HR Dashboard
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#64748b",
                margin: "0.5rem 0 0 0",
              }}
            >
              Welcome back! Here's your comprehensive HR overview.
            </p>
          </div>
          <div
            style={{
              fontSize: "1rem",
              color: "#1e293b",
              backgroundColor: "#f8fafc",
              padding: "0.75rem 1.5rem",
              borderRadius: "2rem",
              fontWeight: 600,
              border: "1px solid #e2e8f0",
            }}
          >
            {formattedDate}
          </div>
        </header>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {stats.map((stat, index) =>
            stat.loading ? (
              <StatCardSkeleton key={index} />
            ) : (
              <div
                key={index}
                style={{
                  background: stat.gradient,
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform:
                    hoveredCard === index
                      ? "translateY(-5px) scale(1.02)"
                      : "translateY(0)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(stat.link)}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    transform:
                      hoveredCard === index ? "scale(1.2)" : "scale(1)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.9)",
                        margin: 0,
                      }}
                    >
                      {stat.title}
                    </p>
                    <p
                      style={{
                        fontSize: "2.2rem",
                        fontWeight: 700,
                        margin: "0.5rem 0 0 0",
                        color: "white",
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "rgba(255,255,255,0.8)",
                          marginTop: "0.5rem",
                        }}
                      >
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "1rem",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(5px)",
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Charts Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Attendance Pie Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              transition: "opacity 0.3s ease",
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
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiActivity color="#10b981" />
                Today's Attendance / Leave Status
              </h3>
              <select
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <option value="attendance">Attendance</option>
                <option value="leave">Leave Status</option>
              </select>
            </div>

            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      selectedChart === "attendance"
                        ? attendanceAnalytics.pieData
                        : selectedChart === "leave"
                          ? leaveAnalytics.statusData
                          : []
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {(selectedChart === "attendance"
                      ? attendanceAnalytics.pieData
                      : selectedChart === "leave"
                        ? leaveAnalytics.statusData
                        : []
                    ).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color || PIE_COLORS[index % PIE_COLORS.length]
                        }
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Attendance Bar Chart - Using ACCURATE API data */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              opacity: loadingStates.weeklyStats ? 0.7 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 1rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiBarChart2 color="#667eea" />
              Weekly Attendance Trend
            </h3>
            <div style={{ height: 280 }}>
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="onTime"
                      name="On Time (by 9:30 AM)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                    <Bar
                      dataKey="late"
                      name="Late"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: "100px",
                    color: "#94a3b8",
                  }}
                >
                  <FiBarChart2
                    size={40}
                    style={{ marginBottom: "10px", opacity: 0.5 }}
                  />
                  <p>Loading attendance data...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Leave Types */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.8fr",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Quick Actions */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiSend />
              Quick Actions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    border: "1px solid #f1f5f9",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 4px rgba(0,0,0,0.05)";
                    e.currentTarget.style.borderColor = "#f1f5f9";
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: action.color + "15",
                      borderRadius: "0.5rem",
                      color: action.color,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {action.icon}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: "0.8rem" }}>
                    {action.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Leave Type Distribution */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              padding: "1.5rem",
              opacity: loadingStates.quickStats ? 0.7 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiPieChart color="#8b5cf6" />
              Leave Types
            </h2>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveAnalytics.leaveTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {leaveAnalytics.leaveTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                marginTop: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {leaveAnalytics.leaveTypeData.slice(0, 3).map((type, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: type.color,
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {type.name}: {type.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Recent Interviews */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              opacity: loadingStates.quickStats ? 0.7 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiBriefcase />
                Recent Interviews
              </h2>
            </div>
            <div>
              {upcomingInterviews.slice(0, 3).map((interview, index) => (
                <div
                  key={interview.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: index < 2 ? "1px solid #f1f5f9" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "1rem",
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      {interview.name
                        ? interview.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontWeight: 600,
                          margin: 0,
                          fontSize: "0.9rem",
                        }}
                      >
                        {interview.name || "Unnamed Candidate"}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          margin: "0.25rem 0 0 0",
                        }}
                      >
                        {interview.position_for || "Position not specified"}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontWeight: 600,
                        margin: 0,
                        fontSize: "0.85rem",
                      }}
                    >
                      {interview.time || "TBD"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        margin: "0.25rem 0 0 0",
                      }}
                    >
                      {interview.interview_date}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingInterviews.length === 0 && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <FiBriefcase
                    size={30}
                    style={{ marginBottom: "0.5rem", opacity: 0.5 }}
                  />
                  <p style={{ fontSize: "0.9rem" }}>No interviews scheduled</p>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Link
                to="/interviews"
                style={{
                  color: "#ec4899",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                View All Interviews
                <FiArrowUp size={14} style={{ transform: "rotate(45deg)" }} />
              </Link>
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              opacity: loadingStates.quickStats ? 0.7 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiCalendar />
                Pending Leave Requests
              </h2>
            </div>
            <div>
              {leaveRequests
                .filter((req) => req.status === "pending")
                .slice(0, 3)
                .map((request, index) => (
                  <div
                    key={request.id}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: index < 2 ? "1px solid #f1f5f9" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "1rem",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {request.employee_name
                          ? request.employee_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <h3
                          style={{
                            fontWeight: 600,
                            margin: 0,
                            fontSize: "0.9rem",
                          }}
                        >
                          {request.employee_name || "Unknown Employee"}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            margin: "0.25rem 0 0 0",
                          }}
                        >
                          {request.leave_type?.replace(/_/g, " ") || "Leave"}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 600,
                          margin: 0,
                          fontSize: "0.85rem",
                        }}
                      >
                        {request.start_date}
                      </p>
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          margin: "0.25rem 0 0 0",
                        }}
                      >
                        to {request.end_date}
                      </p>
                    </div>
                  </div>
                ))}
              {leaveAnalytics.pending === 0 && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <FiCheckCircle
                    size={30}
                    style={{ marginBottom: "0.5rem", opacity: 0.5 }}
                  />
                  <p style={{ fontSize: "0.9rem" }}>
                    No pending leave requests
                  </p>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Link
                to="/employee_leave"
                style={{
                  color: "#f59e0b",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                View All Leave Requests
                <FiArrowUp size={14} style={{ transform: "rotate(45deg)" }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Attendance & Upcoming Holidays */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Today's Attendance */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              opacity: loadingStates.attendance ? 0.7 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiClockIcon />
                Today's Attendance
              </h2>
            </div>
            <div>
              {todayAttendance.map((record, index) => (
                <div
                  key={record.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom:
                      index < todayAttendance.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "1rem",
                        fontWeight: 600,
                      }}
                    >
                      {record.employee_name
                        ? record.employee_name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontWeight: 600,
                          margin: 0,
                          fontSize: "0.9rem",
                        }}
                      >
                        {record.employee_name || "Unknown Employee"}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          margin: "0.25rem 0 0 0",
                        }}
                      >
                        ID: {record.employee || record.id}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontWeight: 600,
                        margin: 0,
                        fontSize: "0.85rem",
                      }}
                    >
                      In: {record.check_in || "--:--"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        margin: "0.25rem 0 0 0",
                      }}
                    >
                      Out: {record.check_out || "--:--"}
                    </p>
                  </div>
                </div>
              ))}
              {todayAttendance.length === 0 && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <FiClockIcon
                    size={30}
                    style={{ marginBottom: "0.5rem", opacity: 0.5 }}
                  />
                  <p style={{ fontSize: "0.9rem" }}>
                    No attendance records for today
                  </p>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Link
                to="/attendance"
                style={{
                  color: "#10b981",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                View All Attendance
                <FiArrowUp size={14} style={{ transform: "rotate(45deg)" }} />
              </Link>
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiGift />
                Upcoming Holidays
              </h2>
            </div>
            <div style={{ padding: "1rem" }}>
              {upcomingHolidays.map((holiday, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.75rem",
                    borderBottom:
                      index < upcomingHolidays.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "#14b8a620",
                        color: "#14b8a6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FiStar size={14} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontWeight: 600,
                          margin: 0,
                          fontSize: "0.9rem",
                        }}
                      >
                        {holiday.name.length > 25
                          ? holiday.name.substring(0, 25) + "..."
                          : holiday.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          margin: "0.25rem 0 0 0",
                        }}
                      >
                        {holiday.date} • {holiday.day}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      backgroundColor: "#14b8a620",
                      color: "#0d9488",
                      borderRadius: "2rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {holiday.days} {holiday.days > 1 ? "days" : "day"}
                  </span>
                </div>
              ))}
              {upcomingHolidays.length === 0 && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <FiGift
                    size={30}
                    style={{ marginBottom: "0.5rem", opacity: 0.5 }}
                  />
                  <p style={{ fontSize: "0.9rem" }}>No upcoming holidays</p>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Link
                to="/holidays"
                style={{
                  color: "#14b8a6",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                View All Holidays
                <FiArrowUp size={14} style={{ transform: "rotate(45deg)" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </div>
  );
};

export default HRWorkPage;
