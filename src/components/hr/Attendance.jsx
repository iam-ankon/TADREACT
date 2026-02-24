import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  getAttendance,
  getEmployees,
  getCompanies,
  deleteAttendanceByMonth,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const Attendance = () => {
  // All useState hooks first
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateFilter, setDateFilter] = useState(() => {
    const saved = localStorage.getItem("attendanceDateFilter");
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return saved || todayStr;
  });
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [availablePageSizes, setAvailablePageSizes] = useState([
    25, 50, 100, 200, 500,
  ]);
  const [isFiltering, setIsFiltering] = useState(false);
  const mainContentRef = useRef(null);

  // All useEffects that don't depend on filteredData
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

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

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    companyFilter,
    monthFilter,
    dateFilter,
    dateRangeStart,
    dateRangeEnd,
    showDateRange,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    companyFilter,
    monthFilter,
    dateFilter,
    dateRangeStart,
    dateRangeEnd,
    showDateRange,
    sortConfig,
  ]);

  // All function declarations
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getTimeValue = (timeStr) => {
    try {
      const timePart = timeStr.includes("T")
        ? timeStr.split("T")[1].slice(0, 5)
        : timeStr.slice(0, 5);
      const [hours, minutes] = timePart.split(":").map(Number);
      return hours * 60 + minutes;
    } catch {
      return 0;
    }
  };

  const parseDelayTime = (delay) => {
    if (!delay) return 0;
    if (typeof delay === "number") {
      return Math.floor(delay / 60);
    } else if (typeof delay === "string") {
      const parts = delay.split(":");
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours * 60 + minutes;
      }
    }
    return 0;
  };

  const sortAttendance = (records) => {
    if (!records || !Array.isArray(records)) return [];
    const sortedRecords = [...records];
    sortedRecords.sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return sortConfig.direction === "ascending"
          ? dateA - dateB
          : dateB - dateA;
      } else if (sortConfig.key === "check_in") {
        const timeA = a.check_in ? getTimeValue(a.check_in) : 0;
        const timeB = b.check_in ? getTimeValue(b.check_in) : 0;
        return sortConfig.direction === "ascending"
          ? timeA - timeB
          : timeB - timeA;
      } else if (sortConfig.key === "check_out") {
        const timeA = a.check_out ? getTimeValue(a.check_out) : 0;
        const timeB = b.check_out ? getTimeValue(b.check_out) : 0;
        return sortConfig.direction === "ascending"
          ? timeA - timeB
          : timeB - timeA;
      } else if (sortConfig.key === "delay_time") {
        const delayA = parseDelayTime(a.attendance_delay || a.delay_time);
        const delayB = parseDelayTime(b.attendance_delay || b.delay_time);
        return sortConfig.direction === "ascending"
          ? delayA - delayB
          : delayB - delayA;
      } else if (sortConfig.key === "employee_name") {
        const nameA = a.employee_name || "";
        const nameB = b.employee_name || "";
        return sortConfig.direction === "ascending"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      return 0;
    });
    return sortedRecords;
  };

  const handleDeleteMonthlyAttendance = async () => {
    if (!monthFilter) {
      alert("Please select a month first");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete ALL attendance records for ${monthFilter}? This action cannot be undone!`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setDeleteError("");
    try {
      const [year, month] = monthFilter.split("-");
      await deleteAttendanceByMonth(year, month);
      const attRes = await getAttendance();
      setAttendance(attRes?.data || []);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error) {
      setDeleteError(error.message || "Failed to delete attendance");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return "9:30 AM";
    try {
      const timePart = timeStr.includes("T")
        ? timeStr.split("T")[1].slice(0, 5)
        : timeStr.slice(0, 5);
      const [hours, minutes] = timePart.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return "9:30 AM";
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

  const isEarlyPunch = (delayTime) => {
    if (!delayTime) return true;
    if (typeof delayTime === "number") {
      return delayTime <= 0;
    } else if (typeof delayTime === "string") {
      const parts = delayTime.split(":");
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours <= 0 && minutes <= 0;
      }
    }
    return true;
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
            (comp.id === employee.company || comp.id === employee.company?.id),
        )
      : null;
    const companyName = company ? company.name || company.company_name : "N/A";
    return {
      employee_id: employee.employee_id || "N/A",
      company: companyName,
      department: employee.department_name || "N/A",
    };
  };

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
          return false;
        }
      });
    } catch (error) {
      return records;
    }
  };

  const filterAttendanceByDate = (records) => {
    if (!records || !Array.isArray(records)) return [];
    if (!showDateRange && dateFilter) {
      return records.filter((r) => {
        if (!r || !r.date) return false;
        return r.date.split("T")[0] === dateFilter;
      });
    }
    if (showDateRange && dateRangeStart && dateRangeEnd) {
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
      return [];
    }
    let filtered = attendance;
    filtered = filterAttendanceByNameAndId(filtered);
    filtered = filterAttendanceByCompany(filtered);
    filtered = filterAttendanceByMonth(filtered);
    filtered = filterAttendanceByDate(filtered);
    filtered = sortAttendance(filtered);
    return filtered;
  };

  // Define filteredData here
  const filteredData = getFilteredAttendance();

  // Now this useEffect can safely use filteredData
  useEffect(() => {
    if (filteredData && filteredData.length >= 0) {
      const total = filteredData.length;
      const sizes = [100];
      const validSizes = sizes.filter((size) => size <= total || size === 25);
      if (!validSizes.includes(itemsPerPage) && validSizes.length > 0) {
        setItemsPerPage(validSizes[0]);
      }
      setAvailablePageSizes(validSizes);
    }
  }, [filteredData.length, itemsPerPage]);

  // Pagination logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const generateSmartReport = () => {
    let data = filteredData;
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
          { month: "long", year: "numeric" },
        )}`
      : dateRangeStart && dateRangeEnd
        ? `Range: ${new Date(dateRangeStart).toLocaleDateString()} - ${new Date(
            dateRangeEnd,
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
          (r) => r && r.date && r.date.split("T")[0].startsWith(prefix),
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
          { month: "long", year: "numeric" },
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
  };

  const clearCompanyFilter = () => {
    setCompanyFilter("");
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const clearMonthFilter = () => {
    setMonthFilter("");
  };

  const clearDateRange = () => {
    setDateRangeStart("");
    setDateRangeEnd("");
    setShowDateRange(false);
  };

  const clearAllFilters = () => {
    clearMonthFilter();
    clearCompanyFilter();
    clearSearch();
    setDateFilter("");
    clearDateRange();
  };

  const handleDateToggle = () => {
    setShowDateRange((v) => !v);
    if (!showDateRange) {
      setDateRangeStart("");
      setDateRangeEnd("");
      setDateFilter("");
    } else {
      setDateRangeStart("");
      setDateRangeEnd("");
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setDateFilter(todayStr);
    }
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

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span style={sortIndicatorStyle}>↕</span>;
    }
    return (
      <span style={sortIndicatorStyle}>
        {sortConfig.direction === "ascending" ? "↑" : "↓"}
      </span>
    );
  };

  const Pagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={paginationContainerStyle}>
        <div style={paginationInfoStyle}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          records
        </div>

        <div style={paginationControlsStyle}>
          <div style={pageSizeSelectorStyle}>
            <span style={pageSizeLabelStyle}>Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={pageSizeSelectStyle}
            >
              {availablePageSizes.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div style={paginationButtonsStyle}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={paginationButtonStyle}
            >
              ‹
            </button>

            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  style={paginationButtonStyle}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span style={paginationEllipsisStyle}>...</span>
                )}
              </>
            )}

            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                style={{
                  ...paginationButtonStyle,
                  ...(currentPage === number
                    ? paginationActiveButtonStyle
                    : {}),
                }}
              >
                {number}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span style={paginationEllipsisStyle}>...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  style={paginationButtonStyle}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={paginationButtonStyle}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#f8fafc",
        height: "100vh",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Sidebars />
      <div
        ref={mainContentRef}
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          overflowX: "hidden",
          height: "100vh",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "1650px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Header */}
          <div style={headerStyle}>
            <div>
              <h2 style={titleStyle}>
                <span style={{ marginRight: "12px" }}>📋</span>
                Attendance Management
              </h2>
              <p style={subtitleStyle}>
                View and manage employee attendance records
              </p>
            </div>
            <div style={summaryStyle}>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Total Records</span>
                <span style={summaryValueStyle}>
                  {filteredData.length}
                  {isFiltering && (
                    <span style={filteringIndicatorStyle}>⟳</span>
                  )}
                </span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Pages</span>
                <span style={summaryValueStyle}>{totalPages}</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Sorting</span>
                <span style={summaryValueStyle}>
                  {sortConfig.key === "date"
                    ? "Date " +
                      (sortConfig.direction === "ascending" ? "↑" : "↓")
                    : sortConfig.key.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {(deleteSuccess || deleteError) && (
            <div
              style={{
                ...statusMessageStyle,
                backgroundColor: deleteSuccess ? "#d1fae5" : "#fee2e2",
                border: `1px solid ${deleteSuccess ? "#10b981" : "#ef4444"}`,
                color: deleteSuccess ? "#065f46" : "#991b1b",
              }}
            >
              <span style={{ fontSize: "18px" }}>
                {deleteSuccess ? "✅" : "❌"}
              </span>
              {deleteSuccess
                ? `Successfully deleted attendance for ${monthFilter}`
                : `Error: ${deleteError}`}
            </div>
          )}

          {/* Filters Card */}
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
                {!showDateRange && dateFilter && (
                  <span style={activeFilterTagStyle}>
                    Date: {new Date(dateFilter).toLocaleDateString()}
                    <button onClick={clearDateFilter} style={tagCloseStyle}>
                      ×
                    </button>
                  </span>
                )}
                {showDateRange && dateRangeStart && dateRangeEnd && (
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
                  (!showDateRange && dateFilter) ||
                  (showDateRange && dateRangeStart && dateRangeEnd)) && (
                  <button onClick={clearAllFilters} style={clearAllButtonStyle}>
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
                        }}
                        style={modernInputStyle}
                        placeholder="Select date"
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
                          }}
                          style={modernInputStyle}
                          placeholder="Start date"
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
                          }}
                          style={modernInputStyle}
                          placeholder="End date"
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
                    onClick={handleDateToggle}
                    style={dateToggleButtonStyle}
                  >
                    {showDateRange ? "Single Date" : "Date Range"}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={actionButtonsRowStyle}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowEmployeeSearch(true)}
                  style={secondaryActionButtonStyle}
                >
                  <span style={buttonIconStyle}>📋</span>
                  Select Employees
                </button>

                {monthFilter && (
                  <button
                    onClick={handleDeleteMonthlyAttendance}
                    style={
                      isDeleting ? deleteButtonStyleDisabled : deleteButtonStyle
                    }
                    disabled={isDeleting}
                  >
                    <span style={buttonIconStyle}>
                      {isDeleting ? "⏳" : "🗑️"}
                    </span>
                    {isDeleting ? "Deleting..." : "Delete Monthly"}
                  </button>
                )}
              </div>

              <div style={reportButtonsGroupStyle}>
                <button
                  onClick={generateSmartReport}
                  style={primaryActionButtonStyle}
                  disabled={!filteredData || filteredData.length === 0}
                >
                  <span style={buttonIconStyle}>📥</span>
                  Download CSV
                  <span style={badgeStyle}>{filteredData.length}</span>
                </button>

                <div style={reportInfoStyle}>
                  {monthFilter
                    ? "Monthly"
                    : showDateRange && dateRangeStart && dateRangeEnd
                      ? "Date Range"
                      : dateFilter
                        ? "Daily"
                        : "Full"}{" "}
                  Report
                  {sortConfig.key &&
                    ` • Sorted by ${sortConfig.key.replace("_", " ")}`}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={quickStatsStyle}>
              <div style={statItemStyle}>
                <span style={statValueStyle}>{filteredData.length}</span>
                <span style={statLabelStyle}>Filtered</span>
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
                Showing {paginatedData.length} of {filteredData.length} records
                {sortConfig.key &&
                  ` • Sorted by ${sortConfig.key.replace("_", " ")}`}
              </div>
            </div>

            <div
              style={{
                ...tableContainerStyle,
                maxHeight: "calc(100vh - 450px)", // Adjusted for pagination
                overflowY: "auto",
                overflowX: "auto",
                position: "relative",
              }}
              className="table-container"
            >
              <table style={tableStyle}>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backgroundColor: "#f7fafc",
                  }}
                >
                  <tr>
                    {[
                      { key: "employee_id", label: "Employee ID" },
                      { key: "employee_name", label: "Employee" },
                      { key: "company", label: "Company" },
                      { key: "department", label: "Department" },
                      { key: "date", label: "Date" },
                      { key: "check_in", label: "Check In" },
                      { key: "check_out", label: "Check Out" },
                      { key: "delay_time", label: "Delay" },
                      { key: "office_start_time", label: "Office Start" },
                    ].map((h) => (
                      <th
                        style={{
                          ...thStyle,
                          position: "sticky",
                          top: 0,
                          backgroundColor: "#f7fafc",
                          zIndex: 11,
                        }}
                        key={h.key}
                        onClick={() =>
                          [
                            "date",
                            "check_in",
                            "check_out",
                            "delay_time",
                            "employee_name",
                          ].includes(h.key) && requestSort(h.key)
                        }
                        className={
                          [
                            "date",
                            "check_in",
                            "check_out",
                            "delay_time",
                            "employee_name",
                          ].includes(h.key)
                            ? "sortable-header"
                            : ""
                        }
                      >
                        <div style={headerContentStyle}>
                          {h.label}
                          {[
                            "date",
                            "check_in",
                            "check_out",
                            "delay_time",
                            "employee_name",
                          ].includes(h.key) && (
                            <SortIndicator columnKey={h.key} />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => <SkeletonRow key={i} />)
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((a, index) => {
                      if (!a) return null;
                      const emp = getEmployeeDetails(a.employee);
                      const delay = a.attendance_delay || a.delay_time;
                      const isEarly = isEarlyPunch(delay);

                      return (
                        <tr
                          key={a.id || index}
                          style={{
                            ...tableRowStyle,
                            animation: `fadeIn 0.3s ease ${index * 0.05}s`,
                          }}
                        >
                          <td style={tdStyle}>
                            <span style={idStyle}>{emp.employee_id}</span>
                          </td>
                          <td style={tdStyle}>
                            <div style={nameStyle}>{a.employee_name}</div>
                          </td>
                          <td style={tdStyle}>
                            <span style={companyCellStyle}>{emp.company}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={departmentCellStyle}>
                              {emp.department}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={dateStyle}>
                              {a.date
                                ? new Date(a.date).toLocaleDateString()
                                : "N/A"}
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
                            <span style={delayStyle(isEarly)}>
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
                          padding: "60px 40px",
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
                          {(monthFilter ||
                            dateFilter ||
                            dateRangeStart ||
                            companyFilter ||
                            searchTerm) && (
                            <button
                              onClick={clearAllFilters}
                              style={emptyStateButtonStyle}
                            >
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && <Pagination />}
          </div>
        </div>
      </div>

      {/* Employee Selection Modal */}
      {showEmployeeSearch && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowEmployeeSearch(false)}
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
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
              <div style={modalSearchContainerStyle}>
                <span style={modalSearchIconStyle}>🔍</span>
                <input
                  type="text"
                  placeholder="Search employees by name or ID..."
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  style={modalInputStyle}
                />
                {employeeSearchTerm && (
                  <button
                    onClick={() => setEmployeeSearchTerm("")}
                    style={modalClearButtonStyle}
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={selectedCountStyle}>
                <span>
                  <strong>
                    {Array.isArray(selectedEmployees)
                      ? selectedEmployees.length
                      : 0}
                  </strong>{" "}
                  employee{selectedEmployees.length !== 1 ? "s" : ""} selected
                </span>
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
                {Array.isArray(employees) && employees.length > 0 ? (
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
                            (e) => e && e.id === employee.id,
                          )
                            ? selectedEmployeeStyle
                            : {}),
                        }}
                        onClick={() => {
                          setSelectedEmployees((prev) => {
                            const exists = prev.find(
                              (e) => e && e.id === employee.id,
                            );
                            return exists
                              ? prev.filter((e) => e && e.id !== employee.id)
                              : [...prev, employee];
                          });
                        }}
                      >
                        <div style={employeeCheckboxStyle}>
                          {selectedEmployees.find(
                            (e) => e && e.id === employee.id,
                          ) && "✓"}
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
                    ))
                ) : (
                  <div style={modalEmptyStyle}>
                    <p>No employees found</p>
                  </div>
                )}
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
                Generate Report ({selectedEmployees.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .sortable-header:hover {
            background-color: #e2e8f0 !important;
            transition: background-color 0.2s ease;
            cursor: pointer;
          }

          /* Scrollbar Styles - Always at edge */
          ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 5px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Firefox scrollbar styles */
          * {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }

          /* Ensure body doesn't scroll */
          body {
            overflow: hidden !important;
            margin: 0;
            padding: 0;
          }

          html {
            overflow: hidden !important;
          }
        `}
      </style>
    </div>
  );
};

// Styles (keeping all existing styles and adding new pagination styles)
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "16px",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1a202c",
  margin: 0,
  display: "flex",
  alignItems: "center",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "4px 0 0 0",
};

const summaryStyle = {
  display: "flex",
  gap: "20px",
  background: "white",
  padding: "8px 16px",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const filteringIndicatorStyle = {
  fontSize: "14px",
  color: "#4299e1",
  animation: "spin 1s linear infinite",
  display: "inline-block",
};

const statusMessageStyle = {
  padding: "12px 16px",
  marginBottom: "16px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  animation: "slideDown 0.3s ease",
};

const filtersCardStyle = {
  background: "white",
  borderRadius: "12px",
  marginBottom: "24px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const filtersHeaderStyle = {
  padding: "10px 14px",
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
  padding: "6px 8px",
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
  borderRadius: "50%",
  transition: "background-color 0.2s",
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
  transition: "all 0.2s ease",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  padding: "10px",
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
  width: "100%",
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
  width: "100%",
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
  flexWrap: "wrap",
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
  padding: "10px 14px",
  borderTop: "1px solid #f1f5f9",
  borderBottom: "1px solid #f1f5f9",
  background: "#fafafa",
  flexWrap: "wrap",
  gap: "12px",
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

const deleteButtonStyle = {
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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
  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
};

const deleteButtonStyleDisabled = {
  ...deleteButtonStyle,
  background: "#9ca3af",
  cursor: "not-allowed",
  opacity: 0.7,
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
  padding: "8px 14px",
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
  marginBottom: "24px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const tableHeaderStyle = {
  padding: "10px 14px",
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
  width: "100%",
  // Let the main container handle vertical scrolling
};

const tableStyle = {
  width: "100%",
  background: "#fff",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle = {
  padding: "8px 12px",
  backgroundColor: "#f7fafc",
  border: "1px solid #e2e8f0",
  textAlign: "left",
  fontWeight: "600",
  color: "#4a5568",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  cursor: "pointer",
  userSelect: "none",
};

const headerContentStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const sortIndicatorStyle = {
  fontSize: "12px",
  color: "#4a5568",
  opacity: 0.7,
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

const companyCellStyle = {
  color: "#4a5568",
};

const departmentCellStyle = {
  color: "#4a5568",
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

const delayStyle = (isEarly) => ({
  color: isEarly ? "#38a169" : "#e53e3e",
  fontWeight: "600",
  fontFamily: "monospace",
  fontSize: "13px",
});

const skeletonStyle = {
  background: "#f7fafc",
  borderRadius: "4px",
  height: "16px",
  animation: "pulse 2s infinite",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "20px",
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
  marginBottom: "16px",
};

const emptyStateButtonStyle = {
  background: "#4299e1",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 16px",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s ease",
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
  animation: "fadeIn 0.2s ease",
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
  animation: "slideUp 0.3s ease",
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
  borderRadius: "50%",
  transition: "background-color 0.2s",
};

const modalBodyStyle = {
  padding: "20px 24px",
  flex: 1,
  overflow: "auto",
};

const modalSearchContainerStyle = {
  position: "relative",
  marginBottom: "16px",
};

const modalSearchIconStyle = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
};

const modalInputStyle = {
  padding: "12px 12px 12px 40px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  width: "100%",
  fontSize: "14px",
  transition: "all 0.2s ease",
};

const modalClearButtonStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "20px",
  height: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
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

const modalEmptyStyle = {
  padding: "40px",
  textAlign: "center",
  color: "#6b7280",
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
  transition: "all 0.2s ease",
};

const generateButtonStyle = {
  ...cancelButtonStyle,
  background: "#4299e1",
  color: "white",
  border: "none",
};

// Pagination Styles
const paginationContainerStyle = {
  padding: "1px 20px",
  borderTop: "1px solid #e2e8f0",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const paginationInfoStyle = {
  fontSize: "14px",
  color: "#4a5568",
  fontWeight: "500",
};

const paginationControlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
  flexWrap: "wrap",
};

const pageSizeSelectorStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const pageSizeLabelStyle = {
  fontSize: "14px",
  color: "#4a5568",
};

const pageSizeSelectStyle = {
  padding: "6px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
  outline: "none",
};

const paginationButtonsStyle = {
  display: "flex",
  alignItems: "center",
  marginTop: "3px",
  marginBottom: "-15px",
  gap: "4px",
};

const paginationButtonStyle = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  backgroundColor: "white",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#4a5568",
  cursor: "pointer",
  transition: "all 0.2s ease",
  minWidth: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ":hover": {
    backgroundColor: "#f7fafc",
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

const paginationActiveButtonStyle = {
  backgroundColor: "#4299e1",
  borderColor: "#4299e1",
  color: "white",
  ":hover": {
    backgroundColor: "#3182ce",
  },
};

const paginationEllipsisStyle = {
  padding: "8px 4px",
  color: "#6b7280",
  fontSize: "14px",
};

export default Attendance;
