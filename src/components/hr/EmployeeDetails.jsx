import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import Sidebars from "./sidebars";
import {
  FaPlus,
  FaPrint,
  FaTrash,
  FaPaperclip,
  FaSearch,
  FaChevronDown,
  FaCalendarAlt,
  FaTimes,
  FaFilter,
  FaUserCircle,
  FaBuilding,
  FaIdBadge,
  FaTint,
  FaBirthdayCake,
  FaEllipsisV,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { FiDownload, FiEdit, FiEye } from "react-icons/fi";

// Utility functions
const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

const checkBirthdateMatch = (employeeDate, filterDate) => {
  if (!employeeDate || !filterDate) return false;
  try {
    const empDate = new Date(employeeDate);
    const filterDateObj = new Date(filterDate);
    return (
      empDate.getMonth() === filterDateObj.getMonth() &&
      empDate.getDate() === filterDateObj.getDate()
    );
  } catch {
    return false;
  }
};

const EmployeeDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [birthdateFilter, setBirthdateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
  const [designationSearch, setDesignationSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeMenu, setShowEmployeeMenu] = useState(null);

  const navigate = useNavigate();
  const employeesPerPage = 10;
  const isInitialMount = useRef(true);
  const filterTimeoutRef = useRef(null);

  // Separate refs for each dropdown
  const designationDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const birthdateDropdownRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedSearchQuery = localStorage.getItem("employeeSearchQuery");
      const savedDesignationFilter = localStorage.getItem(
        "employeeDesignationFilter",
      );
      const savedDepartmentFilter = localStorage.getItem(
        "employeeDepartmentFilter",
      );
      const savedBirthdateFilter = localStorage.getItem(
        "employeeBirthdateFilter",
      );
      const savedPage = localStorage.getItem("employeeListPage");

      if (savedSearchQuery !== null) setSearchQuery(savedSearchQuery);
      if (savedDesignationFilter !== null)
        setDesignationFilter(savedDesignationFilter);
      if (savedDepartmentFilter !== null)
        setDepartmentFilter(savedDepartmentFilter);
      if (savedBirthdateFilter !== null)
        setBirthdateFilter(savedBirthdateFilter);
      if (savedPage) setCurrentPage(parseInt(savedPage, 10) || 1);
    } catch (err) {
      console.error("Error reading from localStorage:", err);
    }
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await getEmployees();
        if (Array.isArray(response.data)) {
          setEmployees(response.data);
        } else {
          throw new Error("Invalid employee data format");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employees. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Save filters to localStorage with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem("employeeSearchQuery", searchQuery);
        localStorage.setItem("employeeDesignationFilter", designationFilter);
        localStorage.setItem("employeeDepartmentFilter", departmentFilter);
        localStorage.setItem("employeeBirthdateFilter", birthdateFilter);
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }
    }, 300);
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [searchQuery, designationFilter, departmentFilter, birthdateFilter]);

  // Unique designations and departments
  const uniqueDesignations = useMemo(() => {
    return [
      ...new Set(employees.map((emp) => emp.designation).filter(Boolean)),
    ].sort();
  }, [employees]);

  const uniqueDepartments = useMemo(() => {
    return [
      ...new Set(employees.map((emp) => emp.department_name).filter(Boolean)),
    ].sort();
  }, [employees]);

  // Filtered lists
  const filteredDesignations = useMemo(() => {
    return uniqueDesignations.filter((designation) =>
      designation.toLowerCase().includes(designationSearch.toLowerCase()),
    );
  }, [uniqueDesignations, designationSearch]);

  const filteredDepartments = useMemo(() => {
    return uniqueDepartments.filter((department) =>
      department.toLowerCase().includes(departmentSearch.toLowerCase()),
    );
  }, [uniqueDepartments, departmentSearch]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    if (!employees.length) return [];
    let sortableItems = [...employees];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [employees, sortConfig]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!sortedEmployees.length) return [];
    const lowerSearchQuery = searchQuery.toLowerCase();
    const hasSearchQuery = searchQuery.trim() !== "";
    return sortedEmployees.filter((employee) => {
      if (!employee) return false;
      if (hasSearchQuery) {
        const matchesSearch =
          employee.name?.toLowerCase().includes(lowerSearchQuery) ||
          employee.employee_id?.toString().includes(searchQuery) ||
          employee.designation?.toLowerCase().includes(lowerSearchQuery) ||
          employee.department_name?.toLowerCase().includes(lowerSearchQuery) ||
          employee.company_name?.toLowerCase().includes(lowerSearchQuery) ||
          employee.blood_group?.toLowerCase().includes(lowerSearchQuery) ||
          employee.date_of_birth?.toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
      }
      if (designationFilter && employee.designation !== designationFilter)
        return false;
      if (departmentFilter && employee.department_name !== departmentFilter)
        return false;
      if (
        birthdateFilter &&
        !checkBirthdateMatch(employee.date_of_birth, birthdateFilter)
      )
        return false;
      return true;
    });
  }, [
    sortedEmployees,
    searchQuery,
    designationFilter,
    departmentFilter,
    birthdateFilter,
  ]);

  // Pagination
  const { currentEmployees, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
    let validatedPage = currentPage;
    if (validatedPage > totalPages && totalPages > 0)
      validatedPage = totalPages;
    else if (filteredEmployees.length === 0) validatedPage = 1;
    if (validatedPage !== currentPage) setCurrentPage(validatedPage);
    const indexOfLastEmployee = validatedPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(
      indexOfFirstEmployee,
      indexOfLastEmployee,
    );
    return { currentEmployees, totalPages };
  }, [filteredEmployees, currentPage, employeesPerPage]);

  // Save current page
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("employeeListPage", currentPage.toString());
      } catch (err) {
        console.error("Error saving page to localStorage:", err);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPage]);

  // Event handlers
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleRowClick = useCallback(
    (id) => {
      navigate(`/employee/${id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        setEmployees((prev) => prev.filter((employee) => employee.id !== id));
      } catch (error) {
        console.error("Error deleting employee:", error);
        setError("Failed to delete employee. Please try again.");
      }
    }
  }, []);

  const handleExport = useCallback(() => {
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === "") return "";
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n") ||
        stringValue.includes("\r")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Format date for CSV
    const formatCSVDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
      } catch {
        return "";
      }
    };

    // Company information (you can customize this)
    const companyName = employees[0]?.company_name || "Company Name";
    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const reportTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create CSV content with enhanced structure
    const csvContent = [
      // Company Header
      `${companyName}`,
      "Employee Directory Export",
      `Report Generated: ${reportDate} at ${reportTime}`,
      `Total Employees: ${employees.length}`,
      `Filtered Results: ${filteredEmployees.length}`,
      "", // Empty line for spacing

      // Summary Statistics
      "SUMMARY STATISTICS",
      `Total Departments: ${uniqueDepartments.length}`,
      `Total Designations: ${uniqueDesignations.length}`,
      `Current Filters: ${searchQuery ? "Search: " + searchQuery + "; " : ""}${designationFilter ? "Designation: " + designationFilter + "; " : ""}${departmentFilter ? "Department: " + departmentFilter + "; " : ""}${birthdateFilter ? "Birth Date: " + formatCSVDate(birthdateFilter) + "; " : ""}`,
      "", // Empty line

      // Main Data Header
      "EMPLOYEE DETAILS",
      "", // Empty line

      // Column Headers
      [
        "Employee ID",
        "Full Name",
        "Email Address",
        "Designation",
        "Department",
        "Company",
        "Blood Group",

        "Joining Date",
      ].join(","),

      // Data Rows
      ...filteredEmployees.map((emp) => {
        // Calculate age if date of birth exists
        const calculateAge = (dob) => {
          if (!dob) return "";
          try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age--;
            }
            return age;
          } catch {
            return "";
          }
        };

        return [
          escapeCSV(emp.employee_id),
          escapeCSV(emp.name),
          escapeCSV(emp.email),
          escapeCSV(emp.designation),
          escapeCSV(emp.department_name),
          escapeCSV(emp.company_name),
          escapeCSV(emp.blood_group),
          formatCSVDate(emp.joining_date),
        ].join(",");
      }),

      // Footer
      "",
      "EXPORT INFORMATION",
      "Generated by Employee Management System",
      `Data as of: ${new Date().toISOString().split("T")[0]}`,
      `Records exported: ${filteredEmployees.length}`,
    ].join("\n");

    // Create and download the file
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Employee_Directory_${companyName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success message (optional)
    alert(
      `CSV exported successfully! ${filteredEmployees.length} records downloaded.`,
    );
  }, [
    employees,
    filteredEmployees,
    uniqueDepartments.length,
    uniqueDesignations.length,
    searchQuery,
    designationFilter,
    departmentFilter,
  ]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setDesignationFilter("");
    setDepartmentFilter("");
    setBirthdateFilter("");
    setCurrentPage(1);
  }, []);

  const closeDropdowns = useCallback(() => {
    setShowDesignationDropdown(false);
    setShowDepartmentDropdown(false);
    setShowBirthdatePicker(false);
    setDesignationSearch("");
    setDepartmentSearch("");
    setShowEmployeeMenu(null);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesignation =
        designationDropdownRef.current &&
        !designationDropdownRef.current.contains(event.target);

      const isOutsideDepartment =
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target);

      const isOutsideBirthdate =
        birthdateDropdownRef.current &&
        !birthdateDropdownRef.current.contains(event.target);

      if (isOutsideDesignation && isOutsideDepartment && isOutsideBirthdate) {
        closeDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdowns]);

  // Loading and error states
  if (loading) {
    return (
      <div className="app-container">
        <Sidebars />
        <div className="main-content">
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Sidebars />
        <div className="main-content">
          <div className="error-container">
            <div className="error-icon">!</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebars />
      <div className="main-content">
        <div className="employee-dashboard">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Employee Directory</h1>
              <p className="subtitle">
                Manage and organize your employee database
              </p>
            </div>
            <div className="header-actions">
              <button className="btn-export" onClick={handleExport}>
                <FiDownload /> Export CSV
              </button>
              {/* <button className="btn-print" onClick={handlePrint}>
                <FaPrint /> Print
              </button> */}
              <button
                className="btn-primary"
                onClick={() => navigate("/add-employee")}
              >
                <FaPlus /> Add Employee
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <FaUserCircle />
              </div>
              <div className="stat-content">
                <h3>{employees.length}</h3>
                <p>Total Employees</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card active">
                <div className="stat-icon active">
                  <FaBuilding />
                </div>
                <div className="stat-content">
                  <h3>{uniqueDepartments.length}</h3>
                  <p>Departments</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon designations">
                <FaIdBadge />
              </div>
              <div className="stat-content">
                <h3>{uniqueDesignations.length}</h3>
                <p>Designations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon filtered">
                <FaFilter />
              </div>
              <div className="stat-content">
                <h3>{filteredEmployees.length}</h3>
                <p>Filtered Results</p>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-card">
            <div className="filters-header">
              <h3>Filters</h3>
              <div className="filter-actions">
                {(searchQuery ||
                  designationFilter ||
                  departmentFilter ||
                  birthdateFilter) && (
                  <button className="btn-clear-all" onClick={clearAllFilters}>
                    <IoMdClose /> Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="search-container">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search employees by name, ID, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchQuery("")}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-grid">
              {/* Designation Filter */}
              <div className="filter-group">
                <label>Designation</label>
                <div
                  className="custom-select-wrapper"
                  ref={designationDropdownRef}
                >
                  <div
                    className={`custom-select ${showDesignationDropdown ? "open" : ""}`}
                    onClick={() => {
                      setShowDesignationDropdown(!showDesignationDropdown);
                      setShowDepartmentDropdown(false);
                      setShowBirthdatePicker(false);
                    }}
                  >
                    <span>{designationFilter || "All Designations"}</span>
                    <FaChevronDown />
                  </div>
                  {showDesignationDropdown && (
                    <div className="dropdown-menu">
                      <div className="dropdown-search">
                        <FaSearch />
                        <input
                          type="text"
                          placeholder="Search designations..."
                          value={designationSearch}
                          onChange={(e) => setDesignationSearch(e.target.value)}
                        />
                      </div>
                      <div className="dropdown-list">
                        <div
                          className={`dropdown-item ${!designationFilter ? "selected" : ""}`}
                          onClick={() => setDesignationFilter("")}
                        >
                          All Designations
                        </div>
                        {filteredDesignations.map((designation) => (
                          <div
                            key={designation}
                            className={`dropdown-item ${designationFilter === designation ? "selected" : ""}`}
                            onClick={() => setDesignationFilter(designation)}
                          >
                            {designation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Department Filter */}
              <div className="filter-group">
                <label>Department</label>
                <div
                  className="custom-select-wrapper"
                  ref={departmentDropdownRef}
                >
                  <div
                    className={`custom-select ${showDepartmentDropdown ? "open" : ""}`}
                    onClick={() => {
                      setShowDepartmentDropdown(!showDepartmentDropdown);
                      setShowDesignationDropdown(false);
                      setShowBirthdatePicker(false);
                    }}
                  >
                    <span>{departmentFilter || "All Departments"}</span>
                    <FaChevronDown />
                  </div>
                  {showDepartmentDropdown && (
                    <div className="dropdown-menu">
                      <div className="dropdown-search">
                        <FaSearch />
                        <input
                          type="text"
                          placeholder="Search departments..."
                          value={departmentSearch}
                          onChange={(e) => setDepartmentSearch(e.target.value)}
                        />
                      </div>
                      <div className="dropdown-list">
                        <div
                          className={`dropdown-item ${!departmentFilter ? "selected" : ""}`}
                          onClick={() => setDepartmentFilter("")}
                        >
                          All Departments
                        </div>
                        {filteredDepartments.map((department) => (
                          <div
                            key={department}
                            className={`dropdown-item ${departmentFilter === department ? "selected" : ""}`}
                            onClick={() => setDepartmentFilter(department)}
                          >
                            {department}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Birthdate Filter */}
              <div className="filter-group">
                <label>Birth Date</label>
                <div
                  className="custom-select-wrapper"
                  ref={birthdateDropdownRef}
                >
                  <div
                    className={`custom-select ${showBirthdatePicker ? "open" : ""}`}
                    onClick={() => {
                      setShowBirthdatePicker(!showBirthdatePicker);
                      setShowDesignationDropdown(false);
                      setShowDepartmentDropdown(false);
                    }}
                  >
                    <span>
                      {birthdateFilter
                        ? formatDateForDisplay(birthdateFilter)
                        : "All Birth Dates"}
                    </span>
                    <div className="select-icons">
                      {birthdateFilter && (
                        <FaTimes
                          onClick={(e) => {
                            e.stopPropagation();
                            setBirthdateFilter("");
                          }}
                        />
                      )}
                      <FaCalendarAlt />
                    </div>
                  </div>
                  {showBirthdatePicker && (
                    <div className="dropdown-menu date-picker">
                      <div className="date-input-wrapper">
                        <input
                          type="date"
                          value={birthdateFilter}
                          onChange={(e) => {
                            setBirthdateFilter(e.target.value);
                            setShowBirthdatePicker(false);
                          }}
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters */}
            <div className="active-filters">
              {designationFilter && (
                <span className="filter-tag">
                  Designation: {designationFilter}
                  <button onClick={() => setDesignationFilter("")}>
                    <FaTimes />
                  </button>
                </span>
              )}
              {departmentFilter && (
                <span className="filter-tag">
                  Department: {departmentFilter}
                  <button onClick={() => setDepartmentFilter("")}>
                    <FaTimes />
                  </button>
                </span>
              )}
              {birthdateFilter && (
                <span className="filter-tag">
                  Birth Date: {formatDateForDisplay(birthdateFilter)}
                  <button onClick={() => setBirthdateFilter("")}>
                    <FaTimes />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Employees Table */}
          <div className="table-card">
            <div className="table-header">
              <h3>Employees ({filteredEmployees.length})</h3>
              <div className="table-actions">
                <span className="results-info">
                  Showing {currentEmployees.length} of{" "}
                  {filteredEmployees.length} employees
                </span>
              </div>
            </div>

            <div className="table-container">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("employee_id")}>
                      ID{" "}
                      {sortConfig.key === "employee_id" &&
                        (sortConfig.direction === "asc" ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        ))}
                    </th>
                    <th onClick={() => handleSort("name")}>
                      Employee{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        ))}
                    </th>
                    <th onClick={() => handleSort("designation")}>
                      Designation{" "}
                      {sortConfig.key === "designation" &&
                        (sortConfig.direction === "asc" ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        ))}
                    </th>
                    <th onClick={() => handleSort("department_name")}>
                      Department{" "}
                      {sortConfig.key === "department_name" &&
                        (sortConfig.direction === "asc" ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        ))}
                    </th>
                    <th>Company</th>
                    <th>Blood Group</th>
                    <th>Birth Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((employee) => (
                      <tr key={employee.id} className="employee-row">
                        <td>
                          <div className="employee-id">
                            <FaIdBadge /> {employee.employee_id}
                          </div>
                        </td>
                        <td>
                          <div
                            className="employee-info"
                            onClick={() => handleRowClick(employee.id)}
                          >
                            <div className="avatar">
                              {employee.profile_picture ? (
                                <img
                                  src={employee.profile_picture}
                                  alt={employee.name}
                                />
                              ) : (
                                <FaUserCircle />
                              )}
                            </div>
                            <div className="employee-details">
                              <div className="employee-name">
                                {employee.name}
                              </div>
                              <div className="employee-email">
                                {employee.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="designation-tag">
                            {employee.designation}
                          </span>
                        </td>
                        <td>
                          <span className="department-tag">
                            {employee.department_name || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className="company-info">
                            <FaBuilding /> {employee.company_name}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`blood-group ${employee.blood_group ? "has-group" : ""}`}
                          >
                            <FaTint /> {employee.blood_group || "N/A"}
                          </div>
                        </td>
                        <td>
                          <div className="birthdate-info">
                            <FaBirthdayCake />{" "}
                            {formatDateForDisplay(employee.date_of_birth) ||
                              "N/A"}
                            {birthdateFilter &&
                              checkBirthdateMatch(
                                employee.date_of_birth,
                                birthdateFilter,
                              ) && <span className="birthday-badge">🎂</span>}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action attachment"
                              onClick={() =>
                                navigate(`/employee/${employee.id}/attachments`)
                              }
                              title="Attachments"
                            >
                              <FaPaperclip />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="no-data">
                      <td colSpan="8">
                        <div className="empty-state">
                          <FaUserCircle />
                          <h4>No employees found</h4>
                          <p>Try adjusting your search or filters</p>
                          <button
                            className="btn-primary"
                            onClick={clearAllFilters}
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern CSS */}
      <style>{`
        :root {
          /* Keep existing variables */
          --primary: #4361ee;
          --primary-light: #e6ebff;
          --secondary: #3a0ca3;
          --accent: #7209b7;
          --success: #4cc9f0;
          --warning: #f72585;
          --danger: #ef233c;
          --dark: #1a1a2e;
          --light: #f8f9fa;
          --gray: #6c757d;
          --border: #e9ecef;
          --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
          --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
          --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
          --radius: 12px;
          --radius-sm: 8px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(67, 97, 238, 0.6), rgba(58, 12, 163, 0.6));
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(67, 97, 238, 0.8), rgba(58, 12, 163, 0.8));
          border: 1px solid transparent;
          background-clip: content-box;
        }

        ::-webkit-scrollbar-corner {
          background: transparent;
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(67, 97, 238, 0.6) rgba(0, 0, 0, 0.05);
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: var(--dark);
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Combined container styles */
        .app-container,
        .employee-list-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          overflow: hidden;
          
        }

        .app-container {
          /* Keep original gradient */
        }

        .employee-list-container {
          background-color: #a7d5e1;
          justify-content: center;
        }

        .main-content,
        .content-wrapper {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
         
          border-radius: 24px 0 0 24px;
          margin-left: -1px;
          max-height: 100vh;
          scroll-behavior: smooth;
        }

        .content-wrapper {
          padding: 2rem;
          justify-content: center;
          background: transparent;
          border-radius: 0;
          margin-left: 0;
        }

        /* Custom scrollbar for main content */
        .main-content::-webkit-scrollbar,
        .content-wrapper::-webkit-scrollbar {
          width: 10px;
        }

        .main-content::-webkit-scrollbar-track,
        .content-wrapper::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 5px;
          margin: 4px 0;
        }

        .main-content::-webkit-scrollbar-thumb,
        .content-wrapper::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 5px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: all 0.3s ease;
        }

        .main-content::-webkit-scrollbar-thumb:hover,
        .content-wrapper::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4290 100%);
        }

        /* Bottom fade effect */
        .main-content::after,
        .content-wrapper::after {
          content: '';
         
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(to bottom, transparent, var(--light));
          pointer-events: none;
          z-index: 10;
        }

        .content-wrapper::after {
          background: linear-gradient(to bottom, transparent, #dceef3);
        }

        .employee-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding-bottom: 40px;
        }

        /* Combined employee card styles */
        .employee-list-card {
          background: #dceef3;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          margin: 0 auto;
          max-width: 1400px;
        }

        /* Combined header styles */
        .dashboard-header,
        .employee-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid var(--border);
        }

        .employee-header {
          margin-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 0.5rem;
          align-items: center;
        }

        .header-content h1 {
          font-size: 32px;
          font-weight: 800;
          color: var(--dark);
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .employee-header h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.8rem;
        }

        .subtitle {
          color: var(--gray);
          font-size: 16px;
        }

        /* Combined action buttons */
        .header-actions,
        .action-buttons {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .action-buttons {
          gap: 0.8rem;
          align-items: center;
          justify-content: center;
        }

        .header-actions button,
        .action-buttons button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
          border: none;
          outline: none;
        }

        .action-buttons button {
          border-radius: 6px;
          gap: 0.5rem;
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
        }

        .btn-export {
          background: white;
          color: var(--primary);
          border: 2px solid var(--primary);
        }

        .btn-export:hover {
          background: var(--primary-light);
        }

        .btn-print {
          background: var(--success);
          color: white;
        }

        .btn-add {
          background-color: rgb(75, 154, 214);
          color: white;
        }

        .btn-add:hover {
          background-color: #005a9e;
        }

        .btn-print:hover {
          background-color: #0e5e0e;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .stats-grid::-webkit-scrollbar {
          height: 6px;
        }

        .stats-grid::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 3px;
        }

        .stat-card {
          background: white;
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-md);
          transition: var(--transition);
          border: 1px solid transparent;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
        }

        .stat-icon.total { background: linear-gradient(135deg, #667eea, #764ba2); }
        .stat-icon.active { background: linear-gradient(135deg, #4cc9f0, #4361ee); }
        .stat-icon.designations { background: linear-gradient(135deg, #f72585, #7209b7); }
        .stat-icon.filtered { background: linear-gradient(135deg, #06d6a0, #118ab2); }

        .stat-content h3 {
          font-size: 32px;
          font-weight: 800;
          color: var(--dark);
          margin-bottom: 4px;
        }

        .stat-content p {
          color: var(--gray);
          font-size: 14px;
          font-weight: 500;
        }

        /* Combined Filters Card */
        .filters-card {
          background: white;
          border-radius: var(--radius);
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: var(--shadow-md);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .filters-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--dark);
        }

        .btn-clear-all {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--light);
          color: var(--danger);
          border: 1px solid var(--danger);
          border-radius: var(--radius-sm);
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-clear-all:hover {
          background: var(--danger);
          color: white;
        }

        /* Combined Search */
        .search-container {
          margin-bottom: 24px;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-wrapper,
        .search-input,
        .filter-input {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .search-input {
          margin-bottom: 1.5rem;
        }

        .search-input input,
        .search-wrapper input {
          width: 100%;
          padding: 16px 48px 16px 48px;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          font-size: 16px;
          transition: var(--transition);
          background: var(--light);
        }

        .search-input input {
          padding: 0.6rem 1rem 0.6rem 2rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
        }

        .search-input input:focus,
        .search-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
          background: white;
        }

        .search-input input:focus {
          border-color: #0078d4;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray);
          font-size: 18px;
        }

        .search-input .search-icon {
          left: 0.8rem;
          color: #777;
        }

        .clear-search {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--gray);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: var(--transition);
        }

        .clear-search:hover {
          background: var(--border);
          color: var(--danger);
        }

        /* Combined Filter Grid */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--dark);
          font-size: 14px;
        }

        /* Combined Custom Select */
        .custom-select-wrapper {
          position: relative;
          width: 100%;
        }

        .custom-select {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          background: white;
          cursor: pointer;
          transition: var(--transition);
          user-select: none;
        }

        .custom-select:hover, .custom-select.open {
          border-color: var(--primary);
        }

        .custom-select span {
          flex: 1;
          color: var(--dark);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .custom-select-value {
          flex: 1;
          color: #777;
        }

        .select-icons,
        .custom-select-icons {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--gray);
        }

        .select-icons svg,
        .custom-select-icons svg {
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
        }

        .select-icons svg:hover,
        .custom-select-icons svg:hover {
          background: var(--light);
        }

        .clear-icon {
          color: #e53935;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px;
        }

        .clear-icon:hover {
          background-color: #ffebee;
          border-radius: 50%;
        }

        .calendar-icon {
          color: #777;
        }

        .custom-select.open .calendar-icon {
          color: #0078d4;
        }

        /* Combined Dropdown */
        .dropdown-menu,
        .custom-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          margin-top: 4px;
          z-index: 1000;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .custom-dropdown {
          border: 1px solid #ddd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-search {
          padding: 12px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dropdown-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
        }

        .dropdown-list,
        .dropdown-options {
          max-height: 300px;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .dropdown-list::-webkit-scrollbar {
          width: 8px;
        }

        .dropdown-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 4px;
        }

        .dropdown-list::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        .dropdown-item,
        .dropdown-option {
          padding: 12px 16px;
          cursor: pointer;
          transition: var(--transition);
          border-bottom: 1px solid var(--border);
        }

        .dropdown-option {
          font-size: 0.95rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .dropdown-item:hover,
        .dropdown-option:hover:not(.disabled) {
          background: var(--primary-light);
        }

        .dropdown-option:hover:not(.disabled) {
          background-color: #f0f4f8;
        }

        .dropdown-item.selected,
        .dropdown-option.selected {
          background: var(--primary);
          color: white;
        }

        .dropdown-option.disabled {
          color: #999;
          cursor: not-allowed;
          background-color: transparent;
        }

        .dropdown-item:last-child,
        .dropdown-option:last-child {
          border-bottom: none;
        }

        .date-picker,
        .date-dropdown {
          padding: 16px;
        }

        .date-dropdown {
          min-width: 300px;
        }

        .date-input-wrapper input,
        .date-input {
          width: 100%;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          transition: var(--transition);
        }

        .date-input {
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .date-input-wrapper input:focus,
        .date-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .date-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #eee;
        }

        .date-picker-header span {
          font-weight: 600;
          color: #333;
        }

        .clear-date-btn {
          background: #ffebee;
          color: #e53935;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          padding: 0.3rem 0.8rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-date-btn:hover {
          background: #ffcdd2;
        }

        .date-picker-hint {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .selected-date-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .selected-date-info p {
          margin: 0.3rem 0;
          color: #555;
        }

        .selected-date {
          font-weight: bold;
          color: #0078d4 !important;
          font-size: 1.1rem;
        }

        .matching-count {
          color: #107c10 !important;
          font-weight: 600;
        }

        /* Combined Active Filters */
        .active-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-gutter: stable;
        }

        .active-filters::-webkit-scrollbar {
          height: 6px;
        }

        .active-filters::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 3px;
        }

        .active-filters::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #06d6a0 0%, #118ab2 100%);
          border-radius: 3px;
        }

        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--primary-light);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .filter-tag button {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          padding: 2px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .filter-tag button:hover {
          background: rgba(67, 97, 238, 0.2);
        }

        /* Combined Table Card */
        .table-card {
          background: white;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .table-header {
          padding: 24px;
          border-bottom: 2px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .table-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--dark);
        }

        .results-info {
          color: var(--gray);
          font-size: 14px;
        }

        /* Table container with custom scrollbar */
        .table-container,
        .table-responsive {
          overflow-x: auto;
          position: relative;
          margin: 0 -24px;
          padding: 0 24px;
          scrollbar-gutter: stable;
          scroll-behavior: smooth;
        }

        .table-responsive {
          overflow-x: auto;
          margin: 0;
          padding: 0;
        }

        .table-container::-webkit-scrollbar,
        .table-responsive::-webkit-scrollbar {
          height: 10px;
        }

        .table-container::-webkit-scrollbar-track,
        .table-responsive::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 5px;
          margin: 0 24px;
        }

        .table-responsive::-webkit-scrollbar-track {
          margin: 0;
        }

        .table-container::-webkit-scrollbar-thumb,
        .table-responsive::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
          border-radius: 5px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        .table-container::-webkit-scrollbar-thumb:hover,
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #3a56d4 0%, #320ba0 100%);
        }

        /* Scroll indicator for table */
        .table-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.9));
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .table-container:hover::after {
          opacity: 1;
        }

        /* Combined Employee Table */
        .employee-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        .employee-table th {
          padding: 16px 20px;
          text-align: left;
          font-weight: 600;
          color: var(--gray);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--border);
          cursor: pointer;
          transition: var(--transition);
          user-select: none;
          white-space: nowrap;
        }

        .employee-table th:hover {
          color: var(--primary);
        }

        .employee-table th svg {
          margin-left: 4px;
          color: var(--primary);
        }

        .employee-table td {
          padding: 20px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        /* Alternative table styles */
        .employee-table th[style*="background-color: rgb(95, 145, 183)"] {
          background-color: rgb(95, 145, 183) !important;
          color: white !important;
          padding: 0.4rem 0.5rem !important;
          text-align: center !important;
          font-size: 0.85rem !important;
        }

        .employee-table td[style*="text-align: center"] {
          padding: 0.3rem 0.5rem !important;
          text-align: center !important;
          font-size: 0.85rem !important;
        }

        .employee-row {
          transition: var(--transition);
          height: auto;
        }

        .employee-row:hover {
          background: linear-gradient(90deg, rgba(67, 97, 238, 0.05), transparent);
          transform: translateX(8px);
          background-color: #f0f4f8 !important;
          cursor: pointer;
        }

        .employee-row:nth-child(even) {
          background-color: #f9f9f9;
        }

        /* Employee Info */
        .employee-info {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .employee-details {
          flex: 1;
        }

        .employee-name {
          font-weight: 600;
          color: var(--dark);
          margin-bottom: 4px;
        }

        .employee-email {
          font-size: 13px;
          color: var(--gray);
        }

        /* Tags */
        .employee-id {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-weight: 600;
          font-family: 'SF Mono', monospace;
        }

        .designation-tag, .department-tag {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .designation-tag {
          background: linear-gradient(135deg, #e6ebff, #dbe4ff);
          color: var(--primary);
        }

        .department-tag {
          background: linear-gradient(135deg, #fff0f6, #ffe6f0);
          color: var(--warning);
        }

        .company-info, .birthdate-info, .blood-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--gray);
        }

        .blood-group.has-group {
          color: var(--danger);
          font-weight: 600;
        }

        .birthday-badge {
          margin-left: 8px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Combined Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          opacity: 1;
          transition: var(--transition);
        }

        .employee-row:hover .action-buttons {
          opacity: 1;
        }

        .btn-action {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          font-size: 14px;
          color: white;
        }

        .btn-action.view { background: var(--success); }
        .btn-action.edit { background: var(--primary); }
        .btn-action.attachment { background: var(--accent); }
        .btn-action.delete { background: var(--danger); }

        .btn-action:hover {
          transform: translateY(-2px) scale(1.1);
        }

        /* Alternative action buttons */
        .action-buttons-cell {
          display: flex;
          gap: 0.3rem;
          padding: 0.2rem;
          justify-content: center;
        }

        .action-buttons-cell button {
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          padding: 0.2rem 0.4rem;
          font-size: 0.75rem;
          border: none;
          width: 28px;
          height: 28px;
        }

        .action-buttons-cell button svg {
          font-size: 0.75rem;
        }

        .btn-attachment {
          background-color: #5f6368;
          color: white;
        }

        .btn-attachment:hover {
          background-color: #4a4d51;
        }

        .btn-delete {
          background-color: #e53935;
          color: white;
        }

        .btn-delete:hover {
          background-color: #c62828;
        }

        /* Combined Empty State */
        .no-data td {
          padding: 80px 20px;
          text-align: center;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--gray);
        }

        .empty-state svg {
          font-size: 64px;
          color: var(--border);
        }

        .empty-state h4 {
          font-size: 20px;
          color: var(--dark);
        }

        .no-results {
          text-align: center;
          padding: 1.5rem;
          color: #666;
        }

        /* Combined Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-top: 1px solid var(--border);
          margin-top: 1.5rem;
        }

        .pagination-btn {
          padding: 10px 20px;
          border: 2px solid var(--border);
          background: white;
          color: var(--dark);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 600;
          transition: var(--transition);
          min-width: 100px;
        }

        .pagination-btn:hover:not(.disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .pagination-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 4px;
        }

        .page-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--border);
          background: white;
          color: var(--dark);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 600;
          transition: var(--transition);
        }

        .page-number:hover:not(.active) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .page-number.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        /* Alternative pagination styles */
        .page-btn {
          padding: 0.5rem 0.8rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #4a4d51;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover:not(.disabled) {
          background-color: #0078d4;
        }

        .page-btn.active {
          background-color: #0078d4;
          border-color: #0078d4;
        }

        .page-btn.disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .ellipsis {
          padding: 0.5rem 0.8rem;
          color: #999;
        }

        /* Loading & Error States */
        .loading-container,
        .error-container,
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .loading-spinner {
          height: 200px;
          font-size: 1.2rem;
          color: #0078d4;
        }

        .loader {
          width: 50px;
          height: 50px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          width: 60px;
          height: 60px;
          background: var(--danger);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .main-content,
          .content-wrapper {
            padding: 16px;
            border-radius: 0;
          }

          .dashboard-header,
          .employee-header {
            flex-direction: column;
            gap: 16px;
          }

          .employee-header {
            gap: 1rem;
            align-items: flex-start;
          }

          .header-actions,
          .action-buttons {
            width: 100%;
            flex-direction: column;
          }

          .action-buttons {
            flex-direction: column;
          }

          .header-actions button,
          .action-buttons button {
            width: 100%;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .employee-table {
            font-size: 14px;
            min-width: 1000px;
          }

          .employee-table th,
          .employee-table td {
            padding: 12px;
          }

          .action-buttons {
            opacity: 1;
            flex-wrap: wrap;
            justify-content: center;
          }

          .btn-action {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }

          .action-buttons-cell {
            flex-direction: column;
            gap: 0.3rem;
          }

          .search-input,
          .filter-input {
            max-width: 100%;
          }

          .date-dropdown {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetails;
