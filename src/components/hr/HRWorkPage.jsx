import React from "react";
import { useState, useEffect } from "react";
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
} from "react-icons/fi";
import {
  getEmployees,
  getInterviews,
  getEmployeeLeaves,
  getCVs,
  getAttendance,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const HRWorkPage = () => {
  const navigate = useNavigate();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [cvCount, setCvCount] = useState(0);
  const [attendanceData, setAttendanceData] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [activeStat, setActiveStat] = useState(null);

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await getEmployees();
        setEmployeeCount(response.data.length || 0);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchInterviews = async () => {
      try {
        const response = await getInterviews();

        console.log("Interview Data:", response.data);

        const sortedInterviews = response.data
          .map((interview) => ({
            ...interview,
            displayTime: interview.time ? formatTime(interview.time) : "--:--",
          }))
          .sort(
            (a, b) => new Date(b.interview_date) - new Date(a.interview_date),
          );

        setUpcomingInterviews(sortedInterviews);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      }
    };

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

    const fetchLeaveRequests = async () => {
      try {
        const response = await getEmployeeLeaves();
        const sortedRequests = response.data.sort((a, b) => {
          return new Date(b.start_date) - new Date(a.start_date);
        });
        setLeaveRequests(sortedRequests);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };

    const fetchCVCount = async () => {
      try {
        const response = await getCVs();
        setCvCount(response.data.length || 0);
      } catch (error) {
        console.error("Error fetching CV count:", error);
      }
    };

    const fetchAttendanceData = async () => {
      try {
        const response = await getAttendance();
        console.log("Attendance Data Response:", response.data);
        setAttendanceData(response.data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    const fetchUpcomingHolidays = () => {
      // This would typically come from an API, but for now we'll use static data
      // based on the HOLIDAY - LOGISTICS -2026.docx file
      const holidays = [
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

      // Filter holidays that are today or in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = holidays
        .filter((holiday) => {
          const holidayDate = new Date(holiday.date);
          holidayDate.setHours(0, 0, 0, 0);
          return holidayDate >= today;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3); // Show next 3 holidays

      setUpcomingHolidays(upcoming);
    };

    fetchEmployeeCount();
    fetchInterviews();
    fetchLeaveRequests();
    fetchCVCount();
    fetchAttendanceData();
    fetchUpcomingHolidays();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const calculateOnTimeAttendancePercentage = (attendanceData) => {
    if (
      !attendanceData ||
      !Array.isArray(attendanceData) ||
      attendanceData.length === 0
    ) {
      return "0%";
    }

    // Filter for today's attendance only
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendanceData.filter((record) => {
      if (!record.date) return false;
      const recordDate = new Date(record.date).toISOString().split("T")[0];
      return recordDate === today;
    });

    if (todayAttendance.length === 0) {
      return "0%";
    }

    // Count employees who checked in at or before 9:30 AM
    const onTimeCount = todayAttendance.filter((record) => {
      if (!record.check_in) return false;

      try {
        // Parse check_in time
        const checkInStr = record.check_in.trim();

        // Check if it's already a full time (HH:MM:SS)
        if (checkInStr.includes(":")) {
          const timeParts = checkInStr.split(":");
          const hours = parseInt(timeParts[0]);
          const minutes = parseInt(timeParts[1]);

          // Simple comparison: before or at 9:30 AM
          if (hours < 9) return true; // Before 9 AM
          if (hours === 9) {
            // At 9 AM, check minutes
            if (minutes <= 30) return true; // At or before 9:30
          }
          return false; // After 9:30
        }

        return false;
      } catch (error) {
        console.warn("Error parsing check_in time:", record.check_in);
        return false;
      }
    }).length;

    // Calculate percentage
    const percentage = Math.round((onTimeCount / todayAttendance.length) * 100);
    return `${percentage}%`;
  };

  // Enhanced stats with trends and colors
  const stats = [
    {
      title: "Employees",
      value: employeeCount,
      icon: <FiUsers size={24} />,
      link: "/employees",
      trendDirection: "up",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      bgColor: "rgba(102, 126, 234, 0.1)",
    },
    {
      title: "On-Time Arrivals",
      value: calculateOnTimeAttendancePercentage(attendanceData),
      icon: <FiClockIcon size={24} />,
      link: "/weekly-attendance-graph",
      trendDirection: "up",
      color: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      bgColor: "rgba(16, 185, 129, 0.1)",
      description: "Arrived by 9:30 AM", // Added description
    },
    {
      title: "Interviews",
      value: upcomingInterviews.length,
      icon: <FiBriefcase size={24} />,
      link: "/interviews",

      trendDirection: "up",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      bgColor: "rgba(245, 87, 108, 0.1)",
    },
    {
      title: "Pending Leaves",
      value: leaveRequests.filter((req) => req.status === "pending").length,
      icon: <FiCalendar size={24} />,
      link: "/employee_leave",

      trendDirection: "up",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      bgColor: "rgba(79, 172, 254, 0.1)",
    },
    {
      title: "CV Bank",
      value: cvCount,
      icon: <FiFileText size={24} />,
      link: "/cv-list",

      trendDirection: "up",
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      bgColor: "rgba(67, 233, 123, 0.1)",
    },
    {
      title: "Upcoming Holidays",
      value: upcomingHolidays.length,
      icon: <FiGift size={24} />,
      link: "/holidays", // You can create a holidays page
      trendDirection: "up",
      color: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
      bgColor: "rgba(255, 154, 158, 0.1)",
      description: "Next 3 holidays",
    },
  ];

  const quickActions = [
    {
      title: "Add New Employee",
      icon: <FiUsers size={20} />,
      link: "/add-employee",
      color: "#667eea",
    },
    {
      title: "Schedule Interview",
      icon: <FiBriefcase size={20} />,
      link: "/interviews",
      color: "#f5576c",
    },
    {
      title: "Process Payroll",
      icon: <FiDollarSign size={20} />,
      link: "/finance-provision",
      color: "#4facfe",
    },
    {
      title: "Send Announcement",
      icon: <FiSend size={20} />,
      link: "/letter-send",
      color: "#43e97b",
    },
    {
      title: "View Holiday Calendar",
      icon: <FiCalendar size={20} />,
      link: "/holidays",
      color: "#ff9a9e",
    },
  ];

  // Get today's attendance data
  const todayAttendance = attendanceData
    .filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getDate() === today.getDate() &&
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear()
      );
    })
    .slice(0, 1);

  // Get the most recent pending leave requests (only 1)
  const recentPendingLeaveRequests = leaveRequests
    .filter((req) => req.status === "pending")
    .slice(0, 1);

  // Get the most recent 3 interviews
  const recentInterviews = upcomingInterviews.slice(0, 3);

  // Format date for display
  const formatHolidayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Sidebar */}
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 1rem" }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: "#ffffff",
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            borderRadius: "0.75rem",
            margin: "1rem 0",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: 0,
              }}
            >
              HR Dashboard
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                margin: "0.25rem 0 0 0",
              }}
            >
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontWeight: 500,
            }}
          >
            {formattedDate}
          </div>
        </header>

        {/* Dashboard Content */}
        <main style={{ padding: "0 0 1.5rem 0" }}>
          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  background: stat.color,
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    activeStat === index ? "translateY(-5px)" : "translateY(0)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setActiveStat(index)}
                onMouseLeave={() => setActiveStat(null)}
                onClick={() => navigate(stat.link)}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(255,255,255,0.1)",
                    opacity: activeStat === index ? 1 : 0,
                    transition: "opacity 0.3s ease",
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
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.8)",
                        margin: 0,
                      }}
                    >
                      {stat.title}
                    </p>
                    {loading && stat.title === "Total Employees" ? (
                      <div
                        style={{
                          height: "2rem",
                          width: "4rem",
                          marginTop: "0.5rem",
                          backgroundColor: "rgba(255,255,255,0.3)",
                          borderRadius: "0.25rem",
                          animation:
                            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }}
                      ></div>
                    ) : error && stat.title === "Total Employees" ? (
                      <p style={{ color: "#fef2f2", marginTop: "0.5rem" }}>
                        Error loading
                      </p>
                    ) : (
                      <div>
                        <p
                          style={{
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            margin: "0.5rem 0 0 0",
                            color: "white",
                          }}
                        >
                          {stat.value}
                        </p>
                        {stat.description && (
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "rgba(255,255,255,0.8)",
                              marginTop: "0.25rem",
                              fontStyle: "italic",
                            }}
                          >
                            {stat.description}
                          </p>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "0.5rem",
                      }}
                    >
                      {stat.trendDirection === "up" ? (
                        <FiTrendingUp size={14} color="#ffffff" />
                      ) : (
                        <FiTrendingUp
                          size={14}
                          color="#ffffff"
                          style={{ transform: "rotate(90deg)" }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "white",
                          marginLeft: "0.25rem",
                        }}
                      >
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "0.75rem",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Quick Actions */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                padding: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FiSend style={{ marginRight: "0.5rem" }} />
                Quick Actions
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
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
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                      border: `1px solid #f1f5f9`,
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                    }}
                  >
                    <div
                      style={{
                        padding: "0.75rem",
                        backgroundColor: action.color + "20",
                        borderRadius: "0.5rem",
                        color: action.color,
                        marginBottom: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {action.icon}
                    </div>
                    <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                      {action.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Interviews */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FiBriefcase style={{ marginRight: "0.5rem" }} />
                  Recent Interviews
                </h2>
                <span
                  style={{
                    backgroundColor: "#f5576c20",
                    color: "#f5576c",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  {recentInterviews.length} upcoming
                </span>
              </div>
              <div>
                {recentInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#f5576c20",
                          color: "#f5576c",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "0.75rem",
                          fontWeight: 600,
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
                            margin: "0 0 0.25rem 0",
                            fontSize: "0.875rem",
                          }}
                        >
                          {interview.name || "No Candidate"}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          {interview.position_for || "No Position"}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 600,
                          margin: "0 0 0.25rem 0",
                          fontSize: "0.875rem",
                        }}
                      >
                        {interview.time
                          ? formatTime(interview.time)
                          : interview.interview_datetime
                            ? new Date(
                                interview.interview_datetime,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        {interview.interview_date}
                      </p>
                    </div>
                  </div>
                ))}
                {recentInterviews.length === 0 && (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <FiBriefcase
                      size={32}
                      color="#cbd5e1"
                      style={{ marginBottom: "0.5rem" }}
                    />
                    <p style={{ margin: 0 }}>
                      No upcoming interviews scheduled
                    </p>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #f1f5f9",
                  textAlign: "center",
                }}
              >
                <Link
                  to="/interviews"
                  style={{
                    color: "#667eea",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  View All Interviews
                  <FiArrowUp
                    style={{ marginLeft: "0.5rem", transform: "rotate(45deg)" }}
                  />
                </Link>
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FiGift style={{ marginRight: "0.5rem" }} />
                  Upcoming Holidays
                </h2>
                <span
                  style={{
                    backgroundColor: "#ff9a9e20",
                    color: "#ff9a9e",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  {upcomingHolidays.length} upcoming
                </span>
              </div>
              <div>
                {upcomingHolidays.map((holiday, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#ff9a9e20",
                          color: "#ff9a9e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        <FiStar size={16} />
                      </div>
                      <div>
                        <h3
                          style={{
                            fontWeight: 600,
                            margin: "0 0 0.25rem 0",
                            fontSize: "0.875rem",
                          }}
                        >
                          {holiday.name}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          {holiday.day}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 600,
                          margin: "0 0 0.25rem 0",
                          fontSize: "0.875rem",
                        }}
                      >
                        {formatHolidayDate(holiday.date)}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#f0f9ff",
                          color: "#0369a1",
                          borderRadius: "1rem",
                        }}
                      >
                        {holiday.days} day{holiday.days > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
                {upcomingHolidays.length === 0 && (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <FiGift
                      size={32}
                      color="#cbd5e1"
                      style={{ marginBottom: "0.5rem" }}
                    />
                    <p style={{ margin: 0 }}>No upcoming holidays</p>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #f1f5f9",
                  textAlign: "center",
                }}
              >
                <Link
                  to="/holidays"
                  style={{
                    color: "#667eea",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  View Holiday Calendar
                  <FiArrowUp
                    style={{ marginLeft: "0.5rem", transform: "rotate(45deg)" }}
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Leave Requests and Today's Attendance */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Pending Leave Requests */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FiCalendar style={{ marginRight: "0.5rem" }} />
                  Recent Leave Requests
                </h2>
                <span
                  style={{
                    backgroundColor: "#4facfe20",
                    color: "#4facfe",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  {recentPendingLeaveRequests.length} pending
                </span>
              </div>
              <div>
                {recentPendingLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#4facfe20",
                          color: "#4facfe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "0.75rem",
                          fontWeight: 600,
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
                            margin: "0 0 0.25rem 0",
                            fontSize: "0.875rem",
                          }}
                        >
                          {request.employee_name}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          {request.leave_type}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 600,
                          margin: "0 0 0.25rem 0",
                          fontSize: "0.875rem",
                        }}
                      >
                        {request.start_date} to {request.end_date}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#fffbeb",
                          color: "#d97706",
                          borderRadius: "1rem",
                        }}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentPendingLeaveRequests.length === 0 && (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <FiCheckCircle
                      size={32}
                      color="#cbd5e1"
                      style={{ marginBottom: "0.5rem" }}
                    />
                    <p style={{ margin: 0 }}>No pending leave requests</p>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #f1f5f9",
                  textAlign: "center",
                }}
              >
                <Link
                  to="/employee_leave"
                  style={{
                    color: "#667eea",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  View All Leave Requests
                  <FiArrowUp
                    style={{ marginLeft: "0.5rem", transform: "rotate(45deg)" }}
                  />
                </Link>
              </div>
            </div>

            {/* Today's Attendance */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FiClockIcon style={{ marginRight: "0.5rem" }} />
                  Today's Attendance
                </h2>
                <span
                  style={{
                    backgroundColor: "#43e97b20",
                    color: "#43e97b",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  {todayAttendance.length} recorded
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                {todayAttendance.map((record, index) => (
                  <div
                    key={record.id}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#43e97b20",
                          color: "#43e97b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "0.75rem",
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
                            margin: "0 0 0.25rem 0",
                            fontSize: "0.875rem",
                          }}
                        >
                          {record.employee_name}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          ID: {record.id}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 600,
                          margin: "0 0 0.25rem 0",
                          fontSize: "0.875rem",
                        }}
                      >
                        Check-in: {record.check_in || "--:--"}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        Check-out: {record.check_out || "--:--"}
                      </p>
                    </div>
                  </div>
                ))}
                {todayAttendance.length === 0 && (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <FiClockIcon
                      size={32}
                      color="#cbd5e1"
                      style={{ marginBottom: "0.5rem" }}
                    />
                    <p style={{ margin: 0 }}>No attendance records for today</p>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid #f1f5f9",
                  textAlign: "center",
                }}
              >
                <Link
                  to="/attendance"
                  style={{
                    color: "#667eea",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  View All Attendance Records
                  <FiArrowUp
                    style={{ marginLeft: "0.5rem", transform: "rotate(45deg)" }}
                  />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HRWorkPage;
