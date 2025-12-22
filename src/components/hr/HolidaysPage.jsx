import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiFilter,
  FiEye,
  FiGift,
  FiStar,
  FiMoon,
  FiSun,
  FiClock,
  FiInfo
} from "react-icons/fi";
import Sidebars from "./sidebars";

const HolidaysPage = () => {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([]);
  const [filteredHolidays, setFilteredHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentYear] = useState(2026);

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    filterHolidays();
  }, [searchTerm, selectedMonth, holidays]);

  const fetchHolidays = () => {
    // Simulating API call with static data from the document
    setTimeout(() => {
      const holidayData = [
        {
          id: 1,
          date: "2026-02-04",
          displayDate: "February 4, 2026",
          day: "Wednesday",
          name: "Shab-E-Barat",
          description: "Muslim holiday - Night of Forgiveness",
          totalDays: 1,
          type: "religious",
          dependsOnMoon: true,
          remarks: "",
          color: "#667eea"
        },
        {
          id: 2,
          date: "2026-02-21",
          displayDate: "February 21, 2026",
          day: "Saturday",
          name: "Shahid Day & International Mother Language Day",
          description: "National day to honor language martyrs",
          totalDays: 1,
          type: "national",
          dependsOnMoon: false,
          remarks: "",
          color: "#dc2626"
        },
        {
          id: 3,
          date: "2026-03-17",
          displayDate: "March 17, 2026",
          day: "Tuesday",
          name: "Shab-E-Qadir",
          description: "Muslim holiday - Night of Decree",
          totalDays: 1,
          type: "religious",
          dependsOnMoon: true,
          remarks: "",
          color: "#667eea"
        },
        {
          id: 4,
          date: "2026-03-19",
          displayDate: "March 19-23, 2026",
          day: "Thursday to Monday",
          name: "Eid-ul-Fitr",
          description: "Muslim festival marking the end of Ramadan",
          totalDays: 5,
          type: "religious",
          dependsOnMoon: true,
          remarks: "Depends on the Moon sighting",
          color: "#10b981"
        },
        {
          id: 5,
          date: "2026-03-26",
          displayDate: "March 26, 2026",
          day: "Thursday",
          name: "Independence Day",
          description: "Bangladesh Independence Day",
          totalDays: 1,
          type: "national",
          dependsOnMoon: false,
          remarks: "",
          color: "#dc2626"
        },
        {
          id: 6,
          date: "2026-04-14",
          displayDate: "April 14, 2026",
          day: "Tuesday",
          name: "Bangla Nababarsha",
          description: "Bengali New Year",
          totalDays: 1,
          type: "cultural",
          dependsOnMoon: false,
          remarks: "",
          color: "#f59e0b"
        },
        {
          id: 7,
          date: "2026-05-01",
          displayDate: "May 1, 2026",
          day: "Friday",
          name: "May Day & Buddha Purnima",
          description: "International Workers' Day and Buddha's Birthday",
          totalDays: 1,
          type: "international",
          dependsOnMoon: false,
          remarks: "",
          color: "#8b5cf6"
        },
        {
          id: 8,
          date: "2026-05-29",
          displayDate: "May 29-31, 2026",
          day: "Friday to Sunday",
          name: "Eid-Ul-Adha",
          description: "Muslim festival of Sacrifice",
          totalDays: 6,
          type: "religious",
          dependsOnMoon: true,
          remarks: "Depends on the Moon sighting",
          color: "#10b981"
        },
        {
          id: 9,
          date: "2026-06-26",
          displayDate: "June 26, 2026",
          day: "Friday",
          name: "Ashura",
          description: "Muslim day of mourning",
          totalDays: 1,
          type: "religious",
          dependsOnMoon: true,
          remarks: "",
          color: "#667eea"
        },
        {
          id: 10,
          date: "2026-09-04",
          displayDate: "September 4, 2026",
          day: "Friday",
          name: "Janmashtami",
          description: "Hindu festival celebrating Krishna's birth",
          totalDays: 1,
          type: "religious",
          dependsOnMoon: false,
          remarks: "",
          color: "#8b5cf6"
        },
        {
          id: 11,
          date: "2026-10-21",
          displayDate: "October 21, 2026",
          day: "Wednesday",
          name: "Durga Puja (Dashami)",
          description: "Hindu festival celebrating Goddess Durga",
          totalDays: 1,
          type: "religious",
          dependsOnMoon: false,
          remarks: "",
          color: "#8b5cf6"
        },
        {
          id: 12,
          date: "2026-12-16",
          displayDate: "December 16, 2026",
          day: "Wednesday",
          name: "Victory Day",
          description: "Bangladesh Victory Day",
          totalDays: 1,
          type: "national",
          dependsOnMoon: false,
          remarks: "",
          color: "#dc2626"
        },
        {
          id: 13,
          date: "2026-12-25",
          displayDate: "December 25-28, 2026",
          day: "Friday to Monday",
          name: "Christmas & Year Ending Holidays",
          description: "Christmas celebrations and year-end holidays",
          totalDays: 4,
          type: "international",
          dependsOnMoon: false,
          remarks: "",
          color: "#ef4444"
        }
      ];

      setHolidays(holidayData);
      setFilteredHolidays(holidayData);
      setLoading(false);
    }, 500);
  };

  const filterHolidays = () => {
    let filtered = [...holidays];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(term) ||
        holiday.description.toLowerCase().includes(term) ||
        holiday.type.toLowerCase().includes(term)
      );
    }

    // Month filter
    if (selectedMonth !== "all") {
      filtered = filtered.filter(holiday => {
        const month = new Date(holiday.date).getMonth() + 1;
        return month.toString() === selectedMonth;
      });
    }

    setFilteredHolidays(filtered);
  };

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  const getMonthOptions = () => {
    const months = [...new Set(holidays.map(h => new Date(h.date).getMonth() + 1))];
    return months.sort((a, b) => a - b);
  };

  const calculateTotalHolidays = () => {
    return holidays.reduce((total, holiday) => total + holiday.totalDays, 0);
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return holidays
      .filter(holiday => new Date(holiday.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  };

  const getHolidayTypeColor = (type) => {
    switch (type) {
      case 'national': return '#dc2626';
      case 'religious': return '#10b981';
      case 'cultural': return '#f59e0b';
      case 'international': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const exportToPDF = () => {
    alert("Exporting holidays to PDF...");
    // Implement PDF export functionality here
  };

  const printHolidays = () => {
    window.print();
  };

  const getHolidayIcon = (type) => {
    switch (type) {
      case 'religious': return <FiMoon size={16} />;
      case 'national': return <FiStar size={16} />;
      case 'cultural': return <FiSun size={16} />;
      case 'international': return <FiGift size={16} />;
      default: return <FiCalendar size={16} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
        <Sidebars />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              border: "4px solid #e2e8f0", 
              borderTopColor: "#667eea",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem"
            }}></div>
            <p style={{ color: "#64748b" }}>Loading holidays...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      <Sidebars />
      
      <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
        {/* Header */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  marginBottom: "0.5rem"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <FiChevronLeft />
                Back
              </button>
              <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                <FiCalendar style={{ marginRight: "0.5rem", display: "inline", verticalAlign: "middle" }} />
                Holiday Calendar {currentYear}
              </h1>
              <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                Total {calculateTotalHolidays()} holiday days in {currentYear}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={exportToPDF}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#f1f5f9",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "#475569",
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                <FiDownload />
                Export
              </button>
              <button
                onClick={printHolidays}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#667eea",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                <FiPrinter />
                Print
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{
              backgroundColor: "#f0f9ff",
              padding: "1rem",
              borderRadius: "0.75rem",
              borderLeft: "4px solid #0ea5e9"
            }}>
              <p style={{ fontSize: "0.875rem", color: "#0369a1", margin: 0 }}>Total Holidays</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0c4a6e", margin: "0.25rem 0 0 0" }}>
                {holidays.length}
              </p>
            </div>
            <div style={{
              backgroundColor: "#f0fdf4",
              padding: "1rem",
              borderRadius: "0.75rem",
              borderLeft: "4px solid #22c55e"
            }}>
              <p style={{ fontSize: "0.875rem", color: "#15803d", margin: 0 }}>Total Days Off</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#14532d", margin: "0.25rem 0 0 0" }}>
                {calculateTotalHolidays()}
              </p>
            </div>
            <div style={{
              backgroundColor: "#fef3c7",
              padding: "1rem",
              borderRadius: "0.75rem",
              borderLeft: "4px solid #f59e0b"
            }}>
              <p style={{ fontSize: "0.875rem", color: "#92400e", margin: 0 }}>Upcoming Holidays</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#78350f", margin: "0.25rem 0 0 0" }}>
                {getUpcomingHolidays().length}
              </p>
            </div>
            <div style={{
              backgroundColor: "#f5f3ff",
              padding: "1rem",
              borderRadius: "0.75rem",
              borderLeft: "4px solid #8b5cf6"
            }}>
              <p style={{ fontSize: "0.875rem", color: "#6d28d9", margin: 0 }}>Religious Holidays</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#4c1d95", margin: "0.25rem 0 0 0" }}>
                {holidays.filter(h => h.type === 'religious').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ 
            display: "flex", 
            gap: "1rem", 
            alignItems: "center",
            backgroundColor: "#f8fafc",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginTop: "1rem"
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              <FiSearch style={{ 
                position: "absolute", 
                left: "0.75rem", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "#94a3b8" 
              }} />
              <input
                type="text"
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  backgroundColor: "white"
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiFilter style={{ color: "#64748b" }} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  backgroundColor: "white",
                  minWidth: "120px"
                }}
              >
                <option value="all">All Months</option>
                {getMonthOptions().map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1e293b", marginBottom: "1rem" }}>
            <FiClock style={{ marginRight: "0.5rem", display: "inline", verticalAlign: "middle" }} />
            Upcoming Holidays
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "1rem" 
          }}>
            {getUpcomingHolidays().map(holiday => (
              <div 
                key={holiday.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  borderLeft: `4px solid ${holiday.color}`,
                  transition: "transform 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {getHolidayIcon(holiday.type)}
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                      {holiday.name}
                    </h3>
                  </div>
                  <span style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: getHolidayTypeColor(holiday.type) + "20",
                    color: getHolidayTypeColor(holiday.type),
                    borderRadius: "1rem",
                    fontSize: "0.75rem",
                    fontWeight: 500
                  }}>
                    {holiday.type}
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.5rem 0" }}>
                  {holiday.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                      {holiday.displayDate}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                      {holiday.day}
                    </p>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "0.5rem"
                  }}>
                    <FiCalendar size={14} color="#64748b" />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                      {holiday.totalDays} day{holiday.totalDays > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {holiday.dependsOnMoon && (
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    padding: "0.5rem",
                    backgroundColor: "#fef3c7",
                    borderRadius: "0.375rem"
                  }}>
                    <FiInfo size={14} color="#d97706" />
                    <span style={{ fontSize: "0.75rem", color: "#92400e" }}>
                      Depends on moon sighting
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Holiday List Table */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
              All Holidays ({filteredHolidays.length})
            </h2>
            <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Showing {filteredHolidays.length} of {holidays.length} holidays
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    Date
                  </th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    Day
                  </th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    Holiday Name
                  </th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    Type
                  </th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    Duration
                  </th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday) => (
                  <tr 
                    key={holiday.id}
                    style={{ 
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.2s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => {/* You can add a detail view here */}}
                  >
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#1e293b" }}>
                      <div style={{ fontWeight: 600 }}>{holiday.displayDate}</div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                      {holiday.day}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "0.5rem",
                          backgroundColor: holiday.color + "20",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: holiday.color
                        }}>
                          {getHolidayIcon(holiday.type)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{holiday.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                            {holiday.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        padding: "0.375rem 0.75rem",
                        backgroundColor: getHolidayTypeColor(holiday.type) + "20",
                        color: getHolidayTypeColor(holiday.type),
                        borderRadius: "1rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        display: "inline-block"
                      }}>
                        {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#1e293b", fontWeight: 600 }}>
                      {holiday.totalDays} day{holiday.totalDays > 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      {holiday.dependsOnMoon ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiMoon size={14} color="#667eea" />
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Depends on moon
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHolidays.length === 0 && (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <FiCalendar size={48} color="#cbd5e1" style={{ marginBottom: "1rem" }} />
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                No holidays found
              </h3>
              <p style={{ color: "#64748b" }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: "#fffbeb",
          borderRadius: "0.5rem",
          border: "1px solid #fde68a"
        }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <FiInfo style={{ color: "#d97706", flexShrink: 0, marginTop: "0.125rem" }} />
            <div>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e", fontWeight: 500 }}>
                Note:
              </p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#92400e" }}>
                All dates are subject to change based on moon sightings and management discretion. 
                Please check with HR department for any updates or changes to the holiday schedule.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add some CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media print {
          .no-print {
            display: none;
          }
          body {
            background: white;
          }
          div {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default HolidaysPage;