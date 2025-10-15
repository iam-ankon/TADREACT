import React, { useEffect, useState } from "react";
import {
  getAttendance,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployees,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";
import axios from "axios";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    employee: "",
    check_in: "",
    check_out: "",
    office_start_time: "09:30",
    delay_time: "",
    id: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Get initial date filter from localStorage or use empty string
  const [dateFilter, setDateFilter] = useState(() => {
    const savedDate = localStorage.getItem('attendanceDateFilter');
    return savedDate || "";
  });
  
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const recordsPerPage = 15;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, empRes, compRes] = await Promise.all([
          getAttendance(),
          getEmployees(),
          axios.get("http://119.148.51.38:8000/api/hrms/api/tad_groups/"),
        ]);

        setAttendance(attRes.data);
        setEmployees(empRes.data);
        setCompanies(
          compRes.data.results ? compRes.data.results : compRes.data
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Save date filter to localStorage whenever it changes
  useEffect(() => {
    if (dateFilter) {
      localStorage.setItem('attendanceDateFilter', dateFilter);
    } else {
      localStorage.removeItem('attendanceDateFilter');
    }
  }, [dateFilter]);

  // Rest of your component remains the same...
  const formatTimeToAMPM = (timeStr) => {
    if (!timeStr) return "-";

    try {
      let timePart = "";
      if (timeStr.includes("T")) {
        timePart = timeStr.split("T")[1].slice(0, 5);
      } else if (timeStr.includes(":")) {
        timePart = timeStr.slice(0, 5);
      } else {
        return timeStr;
      }

      const [hours, minutes] = timePart.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;

      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "-";
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
    }
    else if (typeof delay === "string") {
      const parts = delay.split(":");
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
      }
    }
    return "00:00";
  };

  const getEmployeeDetails = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee)
      return {
        employee_id: "N/A",
        company: "N/A",
        department: "N/A",
      };

    const company = companies.find(
      (comp) => comp.id === employee.company || comp.id === employee.company?.id
    );
    const companyName = company ? company.name || company.company_name : "N/A";

    return {
      employee_id: employee.employee_id || "N/A",
      company: companyName,
      department: employee.department_name || "N/A",
    };
  };

  const handleDeleteAll = async () => {
    if (
      window.confirm("Are you sure you want to delete all attendance records?")
    ) {
      try {
        const deletePromises = attendance.map((record) =>
          deleteAttendance(record.id)
        );
        await Promise.all(deletePromises);
        const res = await getAttendance();
        setAttendance(res.data);
      } catch (err) {
        console.error("Error deleting all records", err);
      }
    }
  };

  const filterAttendanceByDate = (records) => {
    if (!dateFilter) return records;
    
    return records.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateFilter;
    });
  };

  const filterAttendanceByName = (records) => {
    if (!searchTerm) return records;
    
    return records.filter(a =>
      a.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredAttendance = () => {
    let filtered = attendance;
    filtered = filterAttendanceByName(filtered);
    filtered = filterAttendanceByDate(filtered);
    return filtered;
  };

  const generateMonthlyReport = () => {
    const filteredAttendance = getFilteredAttendance();
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
    const csvContent = [
      headers.join(","),
      ...filteredAttendance.map((item) => {
        const empDetails = getEmployeeDetails(item.employee);
        const formattedDate = item.date
          ? new Date(item.date).toLocaleDateString()
          : "N/A";
        return [
          `"${empDetails.employee_id}"`,
          `"${item.employee_name}"`,
          `"${empDetails.company}"`,
          `"${empDetails.department}"`,
          `"${formattedDate}"`,
          `"${formatTimeToAMPM(item.check_in)}"`,
          `"${formatTimeToAMPM(item.check_out)}"`,
          `"${formatDelayTime(item.attendance_delay || item.delay_time)}"`,
          `"${formatTimeToAMPM(item.office_start_time)}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_report_${dateFilter || new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearchTerm("");
  };

  const generateEmployeeReport = () => {
    if (!selectedEmployee) {
      alert("Please select an employee first");
      return;
    }

    const employeeData = attendance.filter(
      (item) => item.employee === selectedEmployee.id
    );

    if (employeeData.length === 0) {
      alert("No attendance records found for this employee");
      return;
    }

    const headers = [
      "Date",
      "Check In",
      "Check Out",
      "Delay Time",
      "Office Start",
    ];

    const empDetails = getEmployeeDetails(selectedEmployee.id);
    const employeeName =
      selectedEmployee.name || selectedEmployee.employee_name || "N/A";

    const csvContent = [
      [`Employee ID: ${empDetails.employee_id}`],
      [`Employee Name: ${employeeName}`],
      [`Company: ${empDetails.company}`],
      [`Department: ${empDetails.department}`],
      [],
      headers.join(","),
      ...employeeData.map((item) => {
        const formattedDate = item.date
          ? new Date(item.date).toLocaleDateString()
          : "N/A";
        return [
          `"${formattedDate}"`,
          `"${formatTimeToAMPM(item.check_in)}"`,
          `"${formatTimeToAMPM(item.check_out)}"`,
          `"${formatDelayTime(item.attendance_delay || item.delay_time)}"`,
          `"${formatTimeToAMPM(item.office_start_time)}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_report_${
      empDetails.employee_id
    }_${employeeName.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDateFilter = () => {
    setDateFilter("");
    setCurrentPage(1);
  };

  const filteredAttendance = getFilteredAttendance();
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAttendance.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div style={{ display: "flex", backgroundColor: "#E7F3F8" }}>
      <Sidebars />
      <div style={{ flex: 1, padding: "30px", overflowX: "auto" }}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowX: "auto" }}>
          <h2
            style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}
          >
            Attendance Management
          </h2>

          {/* Search and Action Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search employee"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "10px",
                  minWidth: "220px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              />
              
              {/* Date Filter Input */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "10px",
                  minWidth: "180px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              />
              
              {dateFilter && (
                <button
                  onClick={clearDateFilter}
                  style={{
                    ...actionButton,
                    background: "#6b7280",
                    padding: "10px 15px",
                  }}
                >
                  Clear Date
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleDeleteAll}
                style={{
                  ...actionButton,
                  background: "#dc2626",
                  padding: "10px 15px",
                }}
              >
                Delete All Records
              </button>

              <button
                onClick={() => setShowEmployeeSearch(true)}
                style={{
                  ...actionButton,
                  background: "#3b82f6",
                  padding: "10px 15px",
                }}
              >
                Employee Report
              </button>

              <button
                onClick={generateMonthlyReport}
                style={{
                  ...actionButton,
                  background: "#10b981",
                  padding: "10px 15px",
                }}
              >
                Generate {dateFilter ? 'Daily' : 'Monthly'} Report
              </button>
            </div>
          </div>

          {/* Filter Info */}
          {dateFilter && (
            <div style={{
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#dbeafe",
              border: "1px solid #3b82f6",
              borderRadius: "5px",
              fontSize: "14px",
            }}>
              Showing attendance for: <strong>{dateFilter}</strong> 
              {filteredAttendance.length > 0 && 
                ` (${filteredAttendance.length} records found)`
              }
            </div>
          )}

          {/* Attendance Table */}
          <div style={{ overflowX: "auto" }}>
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
                  ].map((head) => (
                    <th style={thStyle} key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((a) => {
                    const empDetails = getEmployeeDetails(a.employee);
                    return (
                      <tr key={a.id}>
                        <td style={tdStyle}>{empDetails.employee_id}</td>
                        <td style={tdStyle}>{a.employee_name}</td>
                        <td style={tdStyle}>{empDetails.company}</td>
                        <td style={tdStyle}>{empDetails.department}</td>
                        <td style={tdStyle}>{a.date}</td>
                        <td style={tdStyle}>{formatTimeToAMPM(a.check_in)}</td>
                        <td style={tdStyle}>{formatTimeToAMPM(a.check_out)}</td>
                        <td style={tdStyle}>
                          {formatDelayTime(a.attendance_delay || a.delay_time)}
                        </td>
                        <td style={tdStyle}>
                          {formatTimeToAMPM(a.office_start_time)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ ...tdStyle, textAlign: "center" }}>
                      {dateFilter || searchTerm 
                        ? "No attendance records found for the selected criteria" 
                        : "No attendance records available"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "20px",
                gap: "5px",
              }}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    style={{
                      ...actionButton,
                      background:
                        currentPage === number ? "#2563eb" : "#e5e7eb",
                      color: currentPage === number ? "white" : "black",
                      padding: "8px 12px",
                    }}
                  >
                    {number}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Employee Search Modal */}
      {showEmployeeSearch && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginBottom: "15px" }}>Select Employee</h3>
            <input
              type="text"
              placeholder="Search employee"
              value={employeeSearchTerm}
              onChange={(e) => setEmployeeSearchTerm(e.target.value)}
              style={{
                padding: "10px",
                width: "100%",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {employees
                .filter((emp) =>
                  (emp.name || emp.employee_name || "")
                    .toLowerCase()
                    .includes(employeeSearchTerm.toLowerCase())
                )
                .map((employee) => (
                  <div
                    key={employee.id}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      backgroundColor:
                        selectedEmployee?.id === employee.id
                          ? "#f0f0f0"
                          : "white",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmployeeSelect(employee);
                    }}
                  >
                    {employee.name || employee.employee_name} (
                    {employee.employee_id})
                  </div>
                ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "15px",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setShowEmployeeSearch(false);
                  setEmployeeSearchTerm("");
                  setSelectedEmployee(null);
                }}
                style={{
                  ...actionButton,
                  background: "#6b7280",
                  padding: "8px 15px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  generateEmployeeReport();
                  setShowEmployeeSearch(false);
                }}
                style={{
                  ...actionButton,
                  background: "#3b82f6",
                  padding: "8px 15px",
                }}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles remain the same...
const actionButton = {
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "14px",
};

const tableStyle = {
  width: "100%",
  background: "#fff",
  borderCollapse: "collapse",
  borderRadius: "8px",
  overflow: "hidden",
};

const thStyle = {
  padding: "12px",
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  textAlign: "left",
  fontWeight: "600",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #e5e7eb",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  width: "400px",
  maxWidth: "90%",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

export default Attendance;