import React, { useEffect, useState } from "react";
import {
  getAttendance,
  getEmployees,
  getCompanies,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [dateFilter, setDateFilter] = useState(() => {
    const saved = localStorage.getItem("attendanceDateFilter");
    return saved || "";
  });
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  const recordsPerPage = 15;

  useEffect(() => {
    const savedStart = localStorage.getItem("attendanceDateRangeStart");
    const savedEnd = localStorage.getItem("attendanceDateRangeEnd");
    if (savedStart && savedEnd) {
      setDateRangeStart(savedStart);
      setDateRangeEnd(savedEnd);
      setShowDateRange(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attRes, empRes, compRes] = await Promise.all([
          getAttendance(),
          getEmployees(),
          getCompanies(),
        ]);

        setAttendance(attRes?.data || []);
        setEmployees(empRes?.data || []);
        setCompanies(compRes?.data?.results || compRes?.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAttendance([]);
        setEmployees([]);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (dateFilter) localStorage.setItem("attendanceDateFilter", dateFilter);
    else localStorage.removeItem("attendanceDateFilter");
  }, [dateFilter]);

  useEffect(() => {
    if (dateRangeStart && dateRangeEnd) {
      localStorage.setItem("attendanceDateRangeStart", dateRangeStart);
      localStorage.setItem("attendanceDateRangeEnd", dateRangeEnd);
    } else {
      localStorage.removeItem("attendanceDateRangeStart");
      localStorage.removeItem("attendanceDateRangeEnd");
    }
  }, [dateRangeStart, dateRangeEnd]);

  // ... (all the helper functions remain exactly the same)
  const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return "9:30 AM"; // Default to 8:00 AM when no time provided

    try {
      const timePart = timeStr.includes("T")
        ? timeStr.split("T")[1].slice(0, 5)
        : timeStr.slice(0, 5);
      const [hours, minutes] = timePart.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return "9:30 AM"; // Default to 8:00 AM on error
    }
  };

  const formatDelayTime = (delay) => {
    if (!delay) return "00:00";
    if (typeof delay === "number") {
      const hours = Math.floor(delay / 3600);
      const minutes = Math.floor((delay % 3600) / 60);
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } else if (typeof delay === "string") {
      const parts = delay.split(":");
      if (parts.length >= 2)
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return "00:00";
  };

  const getEmployeeDetails = (employeeId) => {
    if (!employeeId || !Array.isArray(employees)) {
      return { employee_id: "N/A", company: "N/A", department: "N/A" };
    }

    const employee = employees.find((emp) => emp && emp.id === employeeId);
    if (!employee)
      return { employee_id: "N/A", company: "N/A", department: "N/A" };

    const company = Array.isArray(companies)
      ? companies.find(
          (comp) =>
            comp &&
            (comp.id === employee.company || comp.id === employee.company?.id)
        )
      : null;

    const companyName = company ? company.name || company.company_name : "N/A";

    return {
      employee_id: employee.employee_id || "N/A",
      company: companyName,
      department: employee.department_name || "N/A",
    };
  };

  // ... (all filter functions remain exactly the same)
  const filterAttendanceByNameAndId = (records) => {
    if (!records || !Array.isArray(records)) return [];
    if (!searchTerm) return records;

    const searchLower = searchTerm.toLowerCase();
    return records.filter((r) => {
      if (!r) return false;
      const empDetails = getEmployeeDetails(r.employee);
      return (
        (r.employee_name &&
          r.employee_name.toLowerCase().includes(searchLower)) ||
        (empDetails.employee_id &&
          empDetails.employee_id.toString().toLowerCase().includes(searchLower))
      );
    });
  };

  const filterAttendanceByCompany = (records) => {
    if (!records || !Array.isArray(records)) return [];
    if (!companyFilter) return records;

    return records.filter((r) => {
      if (!r) return false;
      const details = getEmployeeDetails(r.employee);
      return details.company === companyFilter;
    });
  };

  const filterAttendanceByMonth = (records) => {
    if (!records || !Array.isArray(records)) return [];
    if (!monthFilter) return records;

    try {
      const [year, month] = monthFilter.split("-");
      const prefix = `${year}-${month}`;

      return records.filter((r) => {
        if (!r || !r.date) return false;

        try {
          const dateStr = r.date.split("T")[0];
          return dateStr.startsWith(prefix);
        } catch (error) {
          console.warn("Invalid date format in record:", r);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in filterAttendanceByMonth:", error);
      return records;
    }
  };

  const filterAttendanceByDate = (records) => {
    if (!records || !Array.isArray(records)) return [];

    if (dateFilter) {
      return records.filter((r) => {
        if (!r || !r.date) return false;
        return r.date.split("T")[0] === dateFilter;
      });
    }

    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart);
      const end = new Date(dateRangeEnd);
      end.setHours(23, 59, 59, 999);

      return records.filter((r) => {
        if (!r || !r.date) return false;
        try {
          const recDate = new Date(r.date.split("T")[0]);
          return recDate >= start && recDate <= end;
        } catch (error) {
          return false;
        }
      });
    }

    return records;
  };

  const getFilteredAttendance = () => {
    if (!attendance || !Array.isArray(attendance)) {
      console.warn(
        "Attendance data is not available or not an array:",
        attendance
      );
      return [];
    }

    let filtered = attendance;
    filtered = filterAttendanceByNameAndId(filtered);
    filtered = filterAttendanceByCompany(filtered);
    filtered = filterAttendanceByMonth(filtered);
    filtered = filterAttendanceByDate(filtered);
    return filtered;
  };

  // ... (all report generation functions remain exactly the same)
  const generateSmartReport = () => {
    let data = getFilteredAttendance();
    if (!data || data.length === 0) {
      alert("No records found");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee",
      "Company",
      "Department",
      "Date",
      "Check In",
      "Check Out",
      "Delay Time",
      "Office Start",
    ];
    const reportTitle = monthFilter
      ? `Monthly Report: ${new Date(monthFilter + "-01").toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" }
        )}`
      : dateRangeStart && dateRangeEnd
      ? `Range: ${new Date(dateRangeStart).toLocaleDateString()} - ${new Date(
          dateRangeEnd
        ).toLocaleDateString()}`
      : dateFilter
      ? `Date: ${new Date(dateFilter).toLocaleDateString()}`
      : "Full Report";

    const filename = monthFilter
      ? `monthly_${monthFilter}.csv`
      : dateRangeStart && dateRangeEnd
      ? `range_${dateRangeStart}_to_${dateRangeEnd}.csv`
      : dateFilter
      ? `date_${dateFilter}.csv`
      : `full_${new Date().toISOString().slice(0, 10)}.csv`;

    const csv = [
      reportTitle,
      `Generated: ${new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      })}`,
      `Total: ${data.length}`,
      "",
      headers.join(","),
      ...data.map((item) => {
        const emp = getEmployeeDetails(item.employee);
        const date = item.date
          ? new Date(item.date).toLocaleDateString()
          : "N/A";
        return [
          `"${emp.employee_id}"`,
          `"${item.employee_name}"`,
          `"${emp.company}"`,
          `"${emp.department}"`,
          `"${date}"`,
          `"${formatTimeToAMPM(item.check_in)}"`,
          `"${formatTimeToAMPM(item.check_out)}"`,
          `"${formatDelayTime(item.attendance_delay || item.delay_time)}"`,
          `"${formatTimeToAMPM(item.office_start_time)}"`,
        ].join(",");
      }),
    ].join("\n");

    downloadCSV(csv, filename);
  };

  const generateEmployeeFullReport = () => {
    if (!selectedEmployees || selectedEmployees.length === 0) {
      alert("Select at least one employee");
      return;
    }

    let allRecords = [];
    selectedEmployees.forEach((emp) => {
      if (!emp || !emp.id) return;

      let records = Array.isArray(attendance)
        ? attendance.filter((r) => r && r.employee === emp.id)
        : [];
      if (monthFilter) {
        const [year, month] = monthFilter.split("-");
        const prefix = `${year}-${month}`;
        records = records.filter(
          (r) => r && r.date && r.date.split("T")[0].startsWith(prefix)
        );
      }
      records.forEach((r) => allRecords.push({ ...r, selected_employee: emp }));
    });

    if (allRecords.length === 0) {
      alert("No records found");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee",
      "Company",
      "Department",
      "Date",
      "Check In",
      "Check Out",
      "Delay Time",
      "Office Start",
    ];
    const reportTitle = monthFilter
      ? `Monthly Report: ${new Date(monthFilter + "-01").toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" }
        )} (${selectedEmployees.length} employees)`
      : `Full Report (${selectedEmployees.length} employees)`;

    const filename = monthFilter
      ? `monthly_${monthFilter}_${selectedEmployees.length}_employees.csv`
      : `full_${selectedEmployees.length}_employees_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

    const csv = [
      reportTitle,
      `Generated: ${new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
      })}`,
      `Total: ${allRecords.length}`,
      "",
      headers.join(","),
      ...allRecords.map((item) => {
        const emp = item.selected_employee;
        const details = getEmployeeDetails(emp.id);
        const date = item.date
          ? new Date(item.date).toLocaleDateString()
          : "N/A";
        return [
          `"${details.employee_id}"`,
          `"${emp.name || emp.employee_name}"`,
          `"${details.company}"`,
          `"${details.department}"`,
          `"${date}"`,
          `"${formatTimeToAMPM(item.check_in)}"`,
          `"${formatTimeToAMPM(item.check_out)}"`,
          `"${formatDelayTime(item.attendance_delay || item.delay_time)}"`,
          `"${formatTimeToAMPM(item.office_start_time)}"`,
        ].join(",");
      }),
    ].join("\n");

    downloadCSV(csv, filename);
    setShowEmployeeSearch(false);
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDateFilter = () => {
    setDateFilter("");
    setCurrentPage(1);
  };
  const clearCompanyFilter = () => {
    setCompanyFilter("");
    setCurrentPage(1);
  };
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };
  const clearMonthFilter = () => {
    setMonthFilter("");
    setCurrentPage(1);
  };
  const clearDateRange = () => {
    setDateRangeStart("");
    setDateRangeEnd("");
    setShowDateRange(false);
    setCurrentPage(1);
  };

  const getUniqueCompanies = () => {
    if (!Array.isArray(employees)) return [];

    const set = new Set();
    employees.forEach((emp) => {
      if (!emp) return;
      const details = getEmployeeDetails(emp.id);
      if (details.company && details.company !== "N/A")
        set.add(details.company);
    });
    return Array.from(set).sort();
  };

  const filteredAttendance = getFilteredAttendance();
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = Array.isArray(filteredAttendance)
    ? filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord)
    : [];
  const totalPages = Math.ceil(
    (Array.isArray(filteredAttendance) ? filteredAttendance.length : 0) /
      recordsPerPage
  );
  const paginate = (page) => setCurrentPage(page);

  // Loading skeleton
  const SkeletonRow = () => (
    <tr>
      {Array(9)
        .fill(0)
        .map((_, i) => (
          <td key={i} style={tdStyle}>
            <div style={skeletonStyle}></div>
          </td>
        ))}
    </tr>
  );

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <Sidebars />
      <div style={{ flex: 1, padding: "24px", overflowX: "auto" }}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowX: "auto" }}>
          {/* Header */}
          <div style={headerStyle}>
            <div>
              <h2 style={titleStyle}>Attendance Management</h2>
              <p style={subtitleStyle}>
                View and manage employee attendance records
              </p>
            </div>
            <div style={summaryStyle}>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Total Records</span>
                <span style={summaryValueStyle}>
                  {Array.isArray(filteredAttendance)
                    ? filteredAttendance.length
                    : 0}
                </span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Current Page</span>
                <span style={summaryValueStyle}>
                  {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* IMPROVED FILTERS & REPORTS CARD */}
          <div style={filtersCardStyle}>
            <div style={filtersHeaderStyle}>
              <div style={filtersTitleStyle}>
                <span style={filtersIconStyle}>🔍</span>
                Filters & Reports
              </div>
              <div style={activeFiltersStyle}>
                {monthFilter && (
                  <span style={activeFilterTagStyle}>
                    Month:{" "}
                    {new Date(monthFilter + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                    <button onClick={clearMonthFilter} style={tagCloseStyle}>
                      ×
                    </button>
                  </span>
                )}
                {companyFilter && (
                  <span style={activeFilterTagStyle}>
                    Company: {companyFilter}
                    <button onClick={clearCompanyFilter} style={tagCloseStyle}>
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span style={activeFilterTagStyle}>
                    Search: {searchTerm}
                    <button onClick={clearSearch} style={tagCloseStyle}>
                      ×
                    </button>
                  </span>
                )}
                {dateFilter && (
                  <span style={activeFilterTagStyle}>
                    Date: {new Date(dateFilter).toLocaleDateString()}
                    <button onClick={clearDateFilter} style={tagCloseStyle}>
                      ×
                    </button>
                  </span>
                )}
                {dateRangeStart && dateRangeEnd && (
                  <span style={activeFilterTagStyle}>
                    Range: {new Date(dateRangeStart).toLocaleDateString()} -{" "}
                    {new Date(dateRangeEnd).toLocaleDateString()}
                    <button onClick={clearDateRange} style={tagCloseStyle}>
                      ×
                    </button>
                  </span>
                )}
                {(monthFilter ||
                  companyFilter ||
                  searchTerm ||
                  dateFilter ||
                  (dateRangeStart && dateRangeEnd)) && (
                  <button
                    onClick={() => {
                      clearMonthFilter();
                      clearCompanyFilter();
                      clearSearch();
                      clearDateFilter();
                      clearDateRange();
                    }}
                    style={clearAllButtonStyle}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Filters Grid */}
            <div style={filtersGridStyle}>
              {/* Search Filter */}
              <div style={filterCardStyle}>
                <label style={filterLabelStyle}>
                  <span style={labelIconStyle}>👤</span>
                  Search Employee
                </label>
                <div style={inputWithButtonStyle}>
                  <input
                    type="text"
                    placeholder="Enter name or employee ID..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={modernInputStyle}
                  />
                  {searchTerm && (
                    <button onClick={clearSearch} style={inputClearButtonStyle}>
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Company Filter */}
              <div style={filterCardStyle}>
                <label style={filterLabelStyle}>
                  <span style={labelIconStyle}>🏢</span>
                  Company
                </label>
                <div style={inputWithButtonStyle}>
                  <select
                    value={companyFilter}
                    onChange={(e) => {
                      setCompanyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={modernSelectStyle}
                  >
                    <option value="">All Companies</option>
                    {getUniqueCompanies().map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {companyFilter && (
                    <button
                      onClick={clearCompanyFilter}
                      style={inputClearButtonStyle}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Month Filter */}
              <div style={filterCardStyle}>
                <label style={filterLabelStyle}>
                  <span style={labelIconStyle}>📅</span>
                  Filter by Month
                </label>
                <div style={inputWithButtonStyle}>
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => {
                      setMonthFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={modernInputStyle}
                  />
                  {monthFilter && (
                    <button
                      onClick={clearMonthFilter}
                      style={inputClearButtonStyle}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div style={filterCardStyle}>
                <label style={filterLabelStyle}>
                  <span style={labelIconStyle}>📆</span>
                  {showDateRange ? "Date Range" : "Specific Date"}
                </label>
                <div style={dateFilterContainerStyle}>
                  {!showDateRange ? (
                    <div style={inputWithButtonStyle}>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                          setDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={modernInputStyle}
                      />
                      {dateFilter && (
                        <button
                          onClick={clearDateFilter}
                          style={inputClearButtonStyle}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={dateRangeContainerStyle}>
                      <div style={inputWithButtonStyle}>
                        <input
                          type="date"
                          value={dateRangeStart}
                          onChange={(e) => {
                            setDateRangeStart(e.target.value);
                            setCurrentPage(1);
                          }}
                          style={modernInputStyle}
                        />
                      </div>
                      <span style={rangeToStyle}>to</span>
                      <div style={inputWithButtonStyle}>
                        <input
                          type="date"
                          value={dateRangeEnd}
                          min={dateRangeStart}
                          onChange={(e) => {
                            setDateRangeEnd(e.target.value);
                            setCurrentPage(1);
                          }}
                          style={modernInputStyle}
                        />
                        {(dateRangeStart || dateRangeEnd) && (
                          <button
                            onClick={clearDateRange}
                            style={inputClearButtonStyle}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowDateRange((v) => !v);
                      if (showDateRange) setDateFilter("");
                      else {
                        setDateRangeStart("");
                        setDateRangeEnd("");
                      }
                      setCurrentPage(1);
                    }}
                    style={dateToggleButtonStyle}
                  >
                    {showDateRange ? "Single Date" : "Date Range"}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={actionButtonsRowStyle}>
              <button
                onClick={() => setShowEmployeeSearch(true)}
                style={secondaryActionButtonStyle}
              >
                <span style={buttonIconStyle}>📋</span>
                Select Employees for Report
              </button>

              <div style={reportButtonsGroupStyle}>
                <button
                  onClick={generateSmartReport}
                  style={primaryActionButtonStyle}
                  disabled={
                    !Array.isArray(filteredAttendance) ||
                    filteredAttendance.length === 0
                  }
                >
                  <span style={buttonIconStyle}>📥</span>
                  Download Current View
                  <span style={badgeStyle}>
                    {Array.isArray(filteredAttendance)
                      ? filteredAttendance.length
                      : 0}
                  </span>
                </button>

                <div style={reportInfoStyle}>
                  {monthFilter
                    ? "Monthly Report"
                    : dateRangeStart && dateRangeEnd
                    ? "Date Range Report"
                    : dateFilter
                    ? "Daily Report"
                    : "Full Report"}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={quickStatsStyle}>
              <div style={statItemStyle}>
                <span style={statValueStyle}>
                  {Array.isArray(filteredAttendance)
                    ? filteredAttendance.length
                    : 0}
                </span>
                <span style={statLabelStyle}>Filtered Records</span>
              </div>
              <div style={statItemStyle}>
                <span style={statValueStyle}>{totalPages}</span>
                <span style={statLabelStyle}>Pages</span>
              </div>
              <div style={statItemStyle}>
                <span style={statValueStyle}>
                  {Array.isArray(companies) ? companies.length : 0}
                </span>
                <span style={statLabelStyle}>Companies</span>
              </div>
              <div style={statItemStyle}>
                <span style={statValueStyle}>
                  {Array.isArray(employees) ? employees.length : 0}
                </span>
                <span style={statLabelStyle}>Employees</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div style={cardStyle}>
            <div style={tableHeaderStyle}>
              <h3 style={tableTitleStyle}>Attendance Records</h3>
              <div style={tableSummaryStyle}>
                Showing {indexOfFirstRecord + 1}-
                {Math.min(
                  indexOfLastRecord,
                  Array.isArray(filteredAttendance)
                    ? filteredAttendance.length
                    : 0
                )}{" "}
                of{" "}
                {Array.isArray(filteredAttendance)
                  ? filteredAttendance.length
                  : 0}{" "}
                records
              </div>
            </div>

            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {[
                      "Employee ID",
                      "Employee",
                      "Company",
                      "Department",
                      "Date",
                      "Check In",
                      "Check Out",
                      "Delay Time",
                      "Office Start",
                    ].map((h) => (
                      <th style={thStyle} key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => <SkeletonRow key={i} />)
                  ) : currentRecords.length > 0 ? (
                    currentRecords.map((a) => {
                      if (!a) return null;
                      const emp = getEmployeeDetails(a.employee);
                      const delay = a.attendance_delay || a.delay_time;
                      return (
                        <tr key={a.id} style={tableRowStyle}>
                          <td style={tdStyle}>
                            <span style={idStyle}>{emp.employee_id}</span>
                          </td>
                          <td style={tdStyle}>
                            <div style={nameStyle}>{a.employee_name}</div>
                          </td>
                          <td style={tdStyle}>{emp.company}</td>
                          <td style={tdStyle}>{emp.department}</td>
                          <td style={tdStyle}>
                            <span style={dateStyle}>
                              {a.date ? a.date.split("T")[0] : "N/A"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={timeStyle}>
                              {formatTimeToAMPM(a.check_in)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={timeStyle}>
                              {formatTimeToAMPM(a.check_out)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={delayStyle(delay)}>
                              {formatDelayTime(delay)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={timeStyle}>
                              {formatTimeToAMPM(a.office_start_time)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        <div style={emptyStateStyle}>
                          <div style={emptyIconStyle}>📊</div>
                          <h3 style={emptyTitleStyle}>No records found</h3>
                          <p style={emptyTextStyle}>
                            {monthFilter ||
                            dateFilter ||
                            dateRangeStart ||
                            companyFilter ||
                            searchTerm
                              ? "Try adjusting your filters to see more results"
                              : "No attendance data available"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={paginationStyle}>
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={paginationButtonStyle}
                >
                  ← Previous
                </button>

                <div style={pageNumbersStyle}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page =
                      totalPages <= 5
                        ? i + 1
                        : currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                    if (page >= 1 && page <= totalPages)
                      return (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          style={{
                            ...paginationButtonStyle,
                            ...(currentPage === page ? activePageStyle : {}),
                          }}
                        >
                          {page}
                        </button>
                      );
                    return null;
                  }).filter(Boolean)}
                </div>

                <button
                  onClick={() =>
                    paginate(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={paginationButtonStyle}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee Selection Modal */}
      {showEmployeeSearch && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Select Employees for Report</h3>
              <button
                onClick={() => {
                  setShowEmployeeSearch(false);
                  setEmployeeSearchTerm("");
                }}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <div style={modalBodyStyle}>
              <input
                type="text"
                placeholder="Search employees by name or ID..."
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                style={modalInputStyle}
              />

              <div style={selectedCountStyle}>
                {Array.isArray(selectedEmployees)
                  ? selectedEmployees.length
                  : 0}{" "}
                employee{selectedEmployees.length !== 1 ? "s" : ""} selected
                {selectedEmployees.length > 0 && (
                  <button
                    onClick={() => setSelectedEmployees([])}
                    style={clearSelectionStyle}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div style={employeeListStyle}>
                {Array.isArray(employees) &&
                  employees
                    .filter((emp) => {
                      if (!emp) return false;
                      const search = employeeSearchTerm.toLowerCase();
                      return (
                        (emp.name || emp.employee_name || "")
                          .toLowerCase()
                          .includes(search) ||
                        (emp.employee_id &&
                          emp.employee_id
                            .toString()
                            .toLowerCase()
                            .includes(search))
                      );
                    })
                    .map((employee) => (
                      <div
                        key={employee.id}
                        style={{
                          ...employeeItemStyle,
                          ...(selectedEmployees.find(
                            (e) => e && e.id === employee.id
                          )
                            ? selectedEmployeeStyle
                            : {}),
                        }}
                        onClick={() => {
                          setSelectedEmployees((prev) => {
                            const exists = prev.find(
                              (e) => e && e.id === employee.id
                            );
                            return exists
                              ? prev.filter((e) => e && e.id !== employee.id)
                              : [...prev, employee];
                          });
                        }}
                      >
                        <div style={employeeCheckboxStyle}>
                          {selectedEmployees.find(
                            (e) => e && e.id === employee.id
                          )
                            ? "✓"
                            : ""}
                        </div>
                        <div style={employeeInfoStyle}>
                          <div style={employeeNameStyle}>
                            {employee.name || employee.employee_name}
                          </div>
                          <div style={employeeIdStyle}>
                            ID: {employee.employee_id}
                          </div>
                          <div style={employeeCompanyStyle}>
                            {getEmployeeDetails(employee.id).company} •{" "}
                            {getEmployeeDetails(employee.id).department}
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button
                onClick={() => {
                  setShowEmployeeSearch(false);
                  setEmployeeSearchTerm("");
                }}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
              <button
                onClick={generateEmployeeFullReport}
                style={generateButtonStyle}
                disabled={
                  !Array.isArray(selectedEmployees) ||
                  selectedEmployees.length === 0
                }
              >
                Generate Report (
                {Array.isArray(selectedEmployees)
                  ? selectedEmployees.length
                  : 0}
                )
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ... (all the style objects remain exactly the same)
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "16px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1a202c",
  margin: 0,
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "4px 0 0 0",
};

const summaryStyle = {
  display: "flex",
  gap: "20px",
};

const summaryItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const summaryLabelStyle = {
  fontSize: "12px",
  color: "#718096",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const summaryValueStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#2d3748",
};

// Filters & Reports Styles
const filtersCardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "0",
  marginBottom: "24px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const filtersHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #f1f5f9",
  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
};

const filtersTitleStyle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1e293b",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const filtersIconStyle = {
  fontSize: "24px",
};

const activeFiltersStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  alignItems: "center",
};

const activeFilterTagStyle = {
  background: "#e0f2fe",
  color: "#0369a1",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  border: "1px solid #bae6fd",
};

const tagCloseStyle = {
  background: "none",
  border: "none",
  color: "#0369a1",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "0",
  width: "16px",
  height: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const clearAllButtonStyle = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "4px 8px",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
  marginLeft: "8px",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  padding: "24px",
};

const filterCardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const filterLabelStyle = {
  fontWeight: "600",
  color: "#374151",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const labelIconStyle = {
  fontSize: "16px",
};

const inputWithButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  position: "relative",
};

const modernInputStyle = {
  padding: "12px 16px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  flex: "1",
  backgroundColor: "white",
  transition: "all 0.2s ease",
  outline: "none",
};

const modernSelectStyle = {
  ...modernInputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%236b7280' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "12px",
};

const inputClearButtonStyle = {
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  fontWeight: "bold",
  flexShrink: 0,
  transition: "all 0.2s ease",
};

const dateFilterContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const dateRangeContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const rangeToStyle = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "500",
  flexShrink: 0,
};

const dateToggleButtonStyle = {
  background: "transparent",
  color: "#3b82f6",
  border: "1px solid #3b82f6",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "12px",
  cursor: "pointer",
  alignSelf: "flex-start",
  transition: "all 0.2s ease",
};

const actionButtonsRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderTop: "1px solid #f1f5f9",
  background: "#fafafa",
};

const secondaryActionButtonStyle = {
  background: "white",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "12px 20px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s ease",
};

const reportButtonsGroupStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "4px",
};

const primaryActionButtonStyle = {
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 20px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s ease",
  position: "relative",
};

const buttonIconStyle = {
  fontSize: "16px",
};

const badgeStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  borderRadius: "12px",
  padding: "2px 8px",
  fontSize: "12px",
  fontWeight: "600",
  marginLeft: "4px",
};

const reportInfoStyle = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "500",
};

const quickStatsStyle = {
  display: "flex",
  justifyContent: "space-around",
  padding: "16px 24px",
  background: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
};

const statItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
};

const statValueStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1f2937",
};

const statLabelStyle = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "500",
};

// Table Styles
const cardStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "0",
  marginBottom: "24px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const tableHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const tableTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: 0,
};

const tableSummaryStyle = {
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "500",
};

const tableContainerStyle = {
  overflowX: "auto",
  
};

const tableStyle = {
  width: "100%",
  background: "#fff",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle = {
  padding: "16px 12px",
  backgroundColor: "#f7fafc",
  border: "1px solid #e2e8f0",
  textAlign: "left",
  fontWeight: "600",
  color: "#4a5568",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "14px 12px",
  border: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const tableRowStyle = {
  transition: "background-color 0.2s",
};

const idStyle = {
  fontWeight: "600",
  color: "#2d3748",
  fontFamily: "monospace",
};

const nameStyle = {
  fontWeight: "600",
  color: "#2d3748",
};

const dateStyle = {
  color: "#4a5568",
  fontWeight: "500",
};

const timeStyle = {
  color: "#718096",
  fontFamily: "monospace",
  fontSize: "13px",
};

const delayStyle = (delay) => ({
  color: delay && delay > 0 ? "#e53e3e" : "#38a169",
  fontWeight: "600",
  fontFamily: "monospace",
  fontSize: "13px",
});

const paginationStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderTop: "1px solid #e2e8f0",
  background: "#fafafa",
};

const paginationButtonStyle = {
  padding: "10px 16px",
  border: "1px solid #e2e8f0",
  background: "white",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  color: "#4a5568",
  transition: "all 0.2s",
};

const activePageStyle = {
  background: "#4299e1",
  color: "white",
  borderColor: "#4299e1",
};

const pageNumbersStyle = {
  display: "flex",
  gap: "4px",
};

const skeletonStyle = {
  background: "#f7fafc",
  borderRadius: "4px",
  height: "16px",
  animation: "pulse 2s infinite",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "40px 20px",
};

const emptyIconStyle = {
  fontSize: "48px",
  marginBottom: "16px",
};

const emptyTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#4a5568",
  marginBottom: "8px",
};

const emptyTextStyle = {
  color: "#718096",
  fontSize: "14px",
};

// Modal Styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  width: "500px",
  maxWidth: "90vw",
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
};

const modalHeaderStyle = {
  padding: "20px 24px 0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const modalTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#2d3748",
  margin: 0,
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#718096",
  padding: 0,
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalBodyStyle = {
  padding: "20px 24px",
  flex: 1,
  overflow: "auto",
};

const modalInputStyle = {
  padding: "12px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  width: "100%",
  marginBottom: "16px",
  fontSize: "14px",
};

const selectedCountStyle = {
  fontSize: "14px",
  color: "#4299e1",
  fontWeight: "600",
  marginBottom: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const clearSelectionStyle = {
  background: "none",
  border: "none",
  color: "#ef4444",
  fontSize: "12px",
  cursor: "pointer",
  fontWeight: "500",
};

const employeeListStyle = {
  maxHeight: "300px",
  overflowY: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
};

const employeeItemStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #f7fafc",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  transition: "background-color 0.2s",
};

const selectedEmployeeStyle = {
  backgroundColor: "#ebf8ff",
  borderLeft: "4px solid #4299e1",
};

const employeeCheckboxStyle = {
  width: "20px",
  height: "20px",
  border: "2px solid #cbd5e0",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#4299e1",
};

const employeeInfoStyle = {
  flex: 1,
};

const employeeNameStyle = {
  fontWeight: "600",
  color: "#2d3748",
  marginBottom: "2px",
};

const employeeIdStyle = {
  fontSize: "12px",
  color: "#718096",
  marginBottom: "2px",
};

const employeeCompanyStyle = {
  fontSize: "11px",
  color: "#9ca3af",
};

const modalFooterStyle = {
  padding: "16px 24px 20px",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  borderTop: "1px solid #e2e8f0",
};

const cancelButtonStyle = {
  padding: "10px 20px",
  border: "1px solid #e2e8f0",
  background: "white",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  color: "#4a5568",
};

const generateButtonStyle = {
  ...cancelButtonStyle,
  background: "#4299e1",
  color: "white",
  border: "none",
};

export default Attendance;
