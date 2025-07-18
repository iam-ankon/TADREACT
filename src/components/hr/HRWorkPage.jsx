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
} from "react-icons/fi";
import axios from "axios";
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

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/employees/"
        );
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
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/interviews/"
        );

        console.log("Interview Data:", response.data); // Debug log

        const sortedInterviews = response.data
          .map((interview) => ({
            ...interview,
            // Ensure time is properly formatted
            displayTime: interview.time ? formatTime(interview.time) : "--:--",
          }))
          .sort(
            (a, b) => new Date(b.interview_date) - new Date(a.interview_date)
          );

        setUpcomingInterviews(sortedInterviews);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      }
    };

    // Add this helper function
    const formatTime = (timeString) => {
      if (!timeString) return "--:--";
      // Handle various time formats
      if (timeString.includes("T")) {
        // ISO format
        return new Date(timeString).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return timeString; // Return as-is if already in HH:MM format
    };
    const fetchLeaveRequests = async () => {
      try {
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/employee_leaves/"
        );
        // Sort leave requests by date (most recent first)
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
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/CVAdd/"
        );
        setCvCount(response.data.length || 0);
      } catch (error) {
        console.error("Error fetching CV count:", error);
      }
    };

    const fetchAttendanceData = async () => {
      try {
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/attendance/"
        );
        console.log("Attendance Data Response:", response.data);
        setAttendanceData(response.data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchEmployeeCount();
    fetchInterviews();
    fetchLeaveRequests();
    fetchCVCount();
    fetchAttendanceData();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    {
      title: "Total Employees",
      value: employeeCount,
      icon: <FiUsers size={24} />,
      link: "/employees",
    },
    {
      title: "Interviews",
      value: upcomingInterviews.length,
      icon: <FiBriefcase size={24} />,
      link: "/interviews",
    },
    {
      title: "Pending Leave Requests",
      value: leaveRequests.filter((req) => req.status === "pending").length,
      icon: <FiCalendar size={24} />,
      link: "/employee_leave",
    },
    {
      title: "CV Bank",
      value: cvCount,
      icon: <FiFileText size={24} />,
      link: "/cv-list",
    },
  ];

  const quickActions = [
    {
      title: "Add New Employee",
      icon: <FiUsers size={20} />,
      link: "/add-employee",
    },
    {
      title: "Schedule Interview",
      icon: <FiBriefcase size={20} />,
      link: "/interviews",
    },
    {
      title: "Process Payroll",
      icon: <FiDollarSign size={20} />,
      link: "/finance-provision",
    },
    {
      title: "Send Announcement",
      icon: <FiSend size={20} />,
      link: "/letter-send",
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
    .slice(0, 1); // Only take the most recent one

  // Get the most recent pending leave requests (only 1)
  const recentPendingLeaveRequests = leaveRequests
    .filter((req) => req.status === "pending")
    .slice(0, 1);

  // Get the most recent 3 interviews
  const recentInterviews = upcomingInterviews.slice(0, 3);

  return (
    <div
      style={{ display: "flex", height: "100vh", backgroundColor: "#DCEEF3" }}
    >
      {/* Sidebar */}
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: "#DCEEF3",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1
              style={{ fontSize: "1.5rem", fontWeight: 700, color: "#374151" }}
            >
              HR Dashboard
            </h1>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {formattedDate}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main style={{ padding: "1.5rem" }}>
          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "rgb(177, 222, 233)",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  border: "1px solid #e5e7eb",
                  transition: "box-shadow 0.3s ease-in-out",
                  cursor: "pointer",
                  ":hover": {
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  },
                }}
                onClick={() => navigate(stat.link)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "#6b7280",
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
                          backgroundColor: "#e5e7eb",
                          borderRadius: "0.25rem",
                          animation:
                            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }}
                      ></div>
                    ) : error && stat.title === "Total Employees" ? (
                      <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                        Error loading
                      </p>
                    ) : (
                      <p
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          marginTop: "0.25rem",
                        }}
                      >
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      padding: "0.5rem",
                      backgroundColor: "#eff6ff",
                      borderRadius: "0.375rem",
                      color: "#2563eb",
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "1rem",
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "4rem",
              }}
            >
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  style={{
                    backgroundColor: " #B9D6F2",
                    padding: "1rem",
                    borderRadius: "1rem",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    border: "1px solid #e5e7eb",
                    transition: "box-shadow 0.3s ease-in-out",
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                    ":hover": {
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    },
                  }}
                >
                  <div
                    style={{
                      marginRight: "0.75rem",
                      padding: "0.5rem",
                      backgroundColor: "#eff6ff",
                      borderRadius: "0.375rem",
                      color: "#2563eb",
                    }}
                  >
                    {action.icon}
                  </div>
                  <span style={{ fontWeight: 500 }}>{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div
            style={{
              backgroundColor: " #A7D5E1",
              borderRadius: "1.5rem",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              border: "1px solid #e5e7eb",
              marginBottom: "2rem",
            }}
          >
            <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Recent Interviews
              </h2>
            </div>
            <div style={{ borderTop: "1px solid #e5e7eb" }}>
              {recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid #e5e7eb",
                    // Removed cursor: pointer and hover effects
                  }}
                  // Removed onClick handler
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3 style={{ fontWeight: 500 }}>
                        {interview.name || "No Candidate"}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {interview.position_for || "No Position"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 500 }}>
                        {interview.time
                          ? formatTime(interview.time)
                          : interview.interview_datetime
                          ? new Date(
                              interview.interview_datetime
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </p>
                      {/* Date display remains the same */}
                      <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {interview.interview_date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentInterviews.length === 0 && (
                <div
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No upcoming interviews scheduled
                </div>
              )}
            </div>
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid #e5e7eb",
                textAlign: "right",
              }}
            >
              <Link
                to="/interviews"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: 500,
                  ":hover": { color: "#1d4ed8" },
                }}
              >
                View All Interviews →
              </Link>
            </div>
          </div>

          {/* Pending Leave Requests and Today's Attendance */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
            }}
          >
            {/* Pending Leave Requests */}
            <div
              style={{
                backgroundColor: " #72BBCE",
                borderRadius: "1.5rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Recent Pending Leave Request
                </h2>
              </div>
              <div style={{ borderTop: "1px solid #e5e7eb" }}>
                {recentPendingLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #e5e7eb",
                      // Removed cursor: pointer and hover effects
                    }}
                    // Removed onClick handler
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h3 style={{ fontWeight: 500 }}>
                          {request.employee_name}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          {request.leave_type}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: 500 }}>
                          {request.start_date} to {request.end_date}
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: "#fffbeb",
                            color: "#d97706",
                            borderRadius: "9999px",
                          }}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentPendingLeaveRequests.length === 0 && (
                  <div
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    No pending leave requests
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "1rem",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "right",
                }}
              >
                <Link
                  to="/employee_leave"
                  style={{
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: 500,
                    ":hover": { color: "#1d4ed8" },
                  }}
                >
                  View All Leave Requests →
                </Link>
              </div>
            </div>

            {/* Today's Attendance */}
            <div
              style={{
                backgroundColor: " #63B0E3",
                borderRadius: "1.5rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Today's Attendance
                </h2>
              </div>
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                {todayAttendance.map((record, index) => (
                  <div
                    key={record.id}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #e5e7eb",
                      // Removed cursor: pointer and hover effects
                    }}
                    // Removed onClick handler
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h3 style={{ fontWeight: 500 }}>
                          {record.employee_name}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          ID: {record.id}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: 500 }}>
                          Check-in: {record.check_in || "--:--"}
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          Check-out: {record.check_out || "--:--"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {todayAttendance.length === 0 && (
                  <div
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    No attendance records for today
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "1rem",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "right",
                }}
              >
                <Link
                  to="/attendance"
                  style={{
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: 500,
                    ":hover": { color: "#1d4ed8" },
                  }}
                >
                  View All Attendance Records →
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
