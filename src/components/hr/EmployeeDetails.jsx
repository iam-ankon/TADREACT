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
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaEye,
  FaEdit,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaBriefcase,
  FaLayerGroup,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { FiDownload, FiEdit, FiEye, FiMoreVertical } from "react-icons/fi";

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
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const navigate = useNavigate();
  const employeesPerPage = 10;
  const isInitialMount = useRef(true);
  const filterTimeoutRef = useRef(null);

  // Refs for dropdowns
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
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
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
          employee.email?.toLowerCase().includes(lowerSearchQuery) ||
          employee.designation?.toLowerCase().includes(lowerSearchQuery) ||
          employee.department_name?.toLowerCase().includes(lowerSearchQuery) ||
          employee.company_name?.toLowerCase().includes(lowerSearchQuery);
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

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(currentEmployees.map((emp) => emp.id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll, currentEmployees]);

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
        setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
      } catch (error) {
        console.error("Error deleting employee:", error);
        setError("Failed to delete employee. Please try again.");
      }
    }
  }, []);

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
    setSelectAll(false);
  };

  const handleExport = useCallback(() => {
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

    const formatCSVDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
      } catch {
        return "";
      }
    };

    const dataToExport =
      selectedRows.length > 0
        ? filteredEmployees.filter((emp) => selectedRows.includes(emp.id))
        : filteredEmployees;

    const companyName = employees[0]?.company_name || "Company Name";
    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const csvContent = [
      `"${companyName} - Employee Directory"`,
      `"Report Generated: ${reportDate}"`,
      `"Total Records: ${dataToExport.length}"`,
      "",
      "Employee ID,Full Name,Email,Designation,Department,Company,Blood Group,Joining Date",
      ...dataToExport.map((emp) =>
        [
          escapeCSV(emp.employee_id),
          escapeCSV(emp.name),
          escapeCSV(emp.email),
          escapeCSV(emp.designation),
          escapeCSV(emp.department_name),
          escapeCSV(emp.company_name),
          escapeCSV(emp.blood_group),
          formatCSVDate(emp.joining_date),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Employees_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [employees, filteredEmployees, selectedRows]);

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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  const getBloodGroupStyle = (bloodGroup) => {
    const bloodGroupColors = {
      "A+": { color: "#2563eb" },
      "A-": { color: "#2563eb" },
      "B+": { color: "#7c3aed" },
      "B-": { color: "#7c3aed" },
      "O+": { color: "#059669" },
      "O-": { color: "#059669" },
      "AB+": { color: "#b45309" },
      "AB-": { color: "#b45309" },
      "A positive": { color: "#2563eb" },
      "B positive": { color: "#7c3aed" },
      "O positive": { color: "#059669" },
      "AB positive": { color: "#b45309" },
      "A-negative": { color: "#2563eb" },
      "B-negative": { color: "#7c3aed" },
      "O-negative": { color: "#059669" },
      "AB-negative": { color: "#b45309" },
    };

    // Normalize the blood group string to handle different formats
    const normalizedGroup = bloodGroup?.toLowerCase().replace(/\s+/g, "");

    // Check for matches
    if (normalizedGroup?.includes("a")) return bloodGroupColors["A+"];
    if (normalizedGroup?.includes("b") && !normalizedGroup?.includes("ab"))
      return bloodGroupColors["B+"];
    if (normalizedGroup?.includes("ab")) return bloodGroupColors["AB+"];
    if (normalizedGroup?.includes("o")) return bloodGroupColors["O+"];

    return bloodGroupColors[bloodGroup] || { color: "#334155" };
  };

  // Loading and error states
  if (loading) {
    return (
      <div style={styles.appContainer}>
        <Sidebars />
        <div style={styles.mainContent}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={{ color: "#64748b" }}>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.appContainer}>
        <Sidebars />
        <div style={styles.mainContent}>
          <div style={styles.errorState}>
            <div style={styles.errorIcon}>!</div>
            <h3
              style={{
                fontSize: "18px",
                color: "#0f172a",
                marginBottom: "8px",
              }}
            >
              Unable to load data
            </h3>
            <p style={{ color: "#64748b", marginBottom: "20px" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={styles.btnPrimary}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.employeeDashboard}>
          {/* Header Section */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <h1 style={styles.pageTitle}>Employees</h1>
              <div style={styles.headerBadge}>
                <FaUsers />
                <span>{employees.length} Total</span>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.btnExport} onClick={handleExport}>
                <FaDownload /> Export CSV
              </button>

              <button
                style={styles.btnPrimary}
                onClick={() => navigate("/add-employee")}
              >
                <FaPlus /> Add Employee
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>
                <FaUsers />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Total Employees</span>
                <span style={styles.statValue}>{employees.length}</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
                <FaLayerGroup />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Departments</span>
                <span style={styles.statValue}>{uniqueDepartments.length}</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconGreen }}>
                <FaBriefcase />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Designations</span>
                <span style={styles.statValue}>
                  {uniqueDesignations.length}
                </span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconOrange }}>
                <FaFilter />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Filtered</span>
                <span style={styles.statValue}>{filteredEmployees.length}</span>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div style={styles.filtersSection}>
            <div style={styles.filtersHeader}>
              <div style={styles.filtersTitle}>
                <FaFilter style={{ color: "#94a3b8" }} />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Filters
                </h3>
              </div>
              {(searchQuery ||
                designationFilter ||
                departmentFilter ||
                birthdateFilter) && (
                <button style={styles.clearFilters} onClick={clearAllFilters}>
                  <FaTimes /> Clear all
                </button>
              )}
            </div>

            <div style={styles.filtersGrid}>
              {/* Search */}
              <div style={styles.searchWrapper}>
                <FaSearch style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    style={styles.clearSearch}
                    onClick={() => setSearchQuery("")}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Designation Filter */}
              <div style={styles.filterWrapper} ref={designationDropdownRef}>
                <div
                  style={{
                    ...styles.filterSelect,
                    ...(showDesignationDropdown
                      ? styles.filterSelectActive
                      : {}),
                  }}
                  onClick={() => {
                    setShowDesignationDropdown(!showDesignationDropdown);
                    setShowDepartmentDropdown(false);
                    setShowBirthdatePicker(false);
                  }}
                >
                  <span style={designationFilter ? {} : styles.placeholder}>
                    {designationFilter || "All Designations"}
                  </span>
                  <FaChevronDown style={styles.chevron} />
                </div>
                {showDesignationDropdown && (
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownSearch}>
                      <FaSearch
                        style={{ color: "#94a3b8", fontSize: "14px" }}
                      />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={designationSearch}
                        onChange={(e) => setDesignationSearch(e.target.value)}
                        style={styles.dropdownSearchInput}
                        autoFocus
                      />
                    </div>
                    <div style={styles.dropdownOptions}>
                      <div
                        style={{
                          ...styles.dropdownOption,
                          ...(!designationFilter
                            ? styles.dropdownOptionSelected
                            : {}),
                        }}
                        onClick={() => {
                          setDesignationFilter("");
                          setShowDesignationDropdown(false);
                        }}
                      >
                        All Designations
                      </div>
                      {filteredDesignations.map((designation) => (
                        <div
                          key={designation}
                          style={{
                            ...styles.dropdownOption,
                            ...(designationFilter === designation
                              ? styles.dropdownOptionSelected
                              : {}),
                          }}
                          onClick={() => {
                            setDesignationFilter(designation);
                            setShowDesignationDropdown(false);
                          }}
                        >
                          {designation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Department Filter */}
              <div style={styles.filterWrapper} ref={departmentDropdownRef}>
                <div
                  style={{
                    ...styles.filterSelect,
                    ...(showDepartmentDropdown
                      ? styles.filterSelectActive
                      : {}),
                  }}
                  onClick={() => {
                    setShowDepartmentDropdown(!showDepartmentDropdown);
                    setShowDesignationDropdown(false);
                    setShowBirthdatePicker(false);
                  }}
                >
                  <span style={departmentFilter ? {} : styles.placeholder}>
                    {departmentFilter || "All Departments"}
                  </span>
                  <FaChevronDown style={styles.chevron} />
                </div>
                {showDepartmentDropdown && (
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownSearch}>
                      <FaSearch
                        style={{ color: "#94a3b8", fontSize: "14px" }}
                      />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        style={styles.dropdownSearchInput}
                        autoFocus
                      />
                    </div>
                    <div style={styles.dropdownOptions}>
                      <div
                        style={{
                          ...styles.dropdownOption,
                          ...(!departmentFilter
                            ? styles.dropdownOptionSelected
                            : {}),
                        }}
                        onClick={() => {
                          setDepartmentFilter("");
                          setShowDepartmentDropdown(false);
                        }}
                      >
                        All Departments
                      </div>
                      {filteredDepartments.map((department) => (
                        <div
                          key={department}
                          style={{
                            ...styles.dropdownOption,
                            ...(departmentFilter === department
                              ? styles.dropdownOptionSelected
                              : {}),
                          }}
                          onClick={() => {
                            setDepartmentFilter(department);
                            setShowDepartmentDropdown(false);
                          }}
                        >
                          {department}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Birthdate Filter */}
              <div style={styles.filterWrapper} ref={birthdateDropdownRef}>
                <div
                  style={{
                    ...styles.filterSelect,
                    ...(showBirthdatePicker ? styles.filterSelectActive : {}),
                  }}
                  onClick={() => {
                    setShowBirthdatePicker(!showBirthdatePicker);
                    setShowDesignationDropdown(false);
                    setShowDepartmentDropdown(false);
                  }}
                >
                  <span style={birthdateFilter ? {} : styles.placeholder}>
                    {birthdateFilter
                      ? formatDateForDisplay(birthdateFilter)
                      : "Birth Date"}
                  </span>
                  <div style={styles.selectIcons}>
                    {birthdateFilter && (
                      <FaTimes
                        style={styles.clearIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBirthdateFilter("");
                        }}
                      />
                    )}
                    <FaCalendarAlt style={{ color: "#94a3b8" }} />
                  </div>
                </div>
                {showBirthdatePicker && (
                  <div style={{ ...styles.dropdownMenu, ...styles.datePicker }}>
                    <input
                      type="date"
                      value={birthdateFilter}
                      onChange={(e) => {
                        setBirthdateFilter(e.target.value);
                        setShowBirthdatePicker(false);
                      }}
                      max={new Date().toISOString().split("T")[0]}
                      style={styles.dateInput}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {(designationFilter || departmentFilter || birthdateFilter) && (
              <div style={styles.activeFilters}>
                {designationFilter && (
                  <span style={styles.filterTag}>
                    Designation: {designationFilter}
                    <button
                      style={styles.filterTagButton}
                      onClick={() => setDesignationFilter("")}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {departmentFilter && (
                  <span style={styles.filterTag}>
                    Department: {departmentFilter}
                    <button
                      style={styles.filterTagButton}
                      onClick={() => setDepartmentFilter("")}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {birthdateFilter && (
                  <span style={styles.filterTag}>
                    Birth Date: {formatDateForDisplay(birthdateFilter)}
                    <button
                      style={styles.filterTagButton}
                      onClick={() => setBirthdateFilter("")}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table Section */}
          <div style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <div style={styles.tableTitle}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Employee Directory
                </h3>
                <span style={styles.resultCount}>
                  {filteredEmployees.length} records
                </span>
              </div>
              <div style={styles.tableActions}>
                <span style={styles.selectionInfo}>
                  {selectedRows.length > 0 && `${selectedRows.length} selected`}
                </span>
              </div>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.employeeTable}>
                <thead>
                  <tr>
                    {/* <th style={styles.checkboxCell}>
                      <label style={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => setSelectAll(e.target.checked)}
                          style={styles.checkboxInput}
                        />
                        <span style={styles.checkmark}></span>
                      </label>
                    </th> */}
                    <th
                      onClick={() => handleSort("employee_id")}
                      style={{ ...styles.tableHeaderCell, ...styles.sortable }}
                    >
                      ID {getSortIcon("employee_id")}
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      style={{ ...styles.tableHeaderCell, ...styles.sortable }}
                    >
                      Employee {getSortIcon("name")}
                    </th>
                    <th
                      onClick={() => handleSort("designation")}
                      style={{ ...styles.tableHeaderCell, ...styles.sortable }}
                    >
                      Designation {getSortIcon("designation")}
                    </th>
                    <th
                      onClick={() => handleSort("department_name")}
                      style={{ ...styles.tableHeaderCell, ...styles.sortable }}
                    >
                      Department {getSortIcon("department_name")}
                    </th>
                    <th style={styles.tableHeaderCell}>Company</th>
                    <th style={styles.tableHeaderCell}>Blood Group</th>
                    <th style={styles.tableHeaderCell}>Birth Date</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        style={{
                          ...styles.employeeRow,
                          ...(selectedRows.includes(employee.id)
                            ? styles.employeeRowSelected
                            : {}),
                        }}
                      >
                        {/* <td
                          style={styles.checkboxCell}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label style={styles.checkbox}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(employee.id)}
                              onChange={(e) => handleSelectRow(employee.id, e)}
                              style={styles.checkboxInput}
                            />
                            <span style={styles.checkmark}></span>
                          </label>
                        </td> */}
                        <td style={styles.tableCell}>
                          <span style={styles.employeeId}>
                            {employee.employee_id}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div
                            style={styles.employeeInfo}
                            onClick={() => handleRowClick(employee.id)}
                          >
                            <div style={styles.employeeAvatar}>
                              {employee.image1 ? (
                                <img
                                  src={employee.image1}
                                  alt={employee.name}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <FaUserCircle />
                              )}
                            </div>
                            <div style={styles.employeeDetails}>
                              <div style={styles.employeeName}>
                                {employee.name}
                              </div>
                              <div style={styles.employeeEmail}>
                                {employee.email || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.badge,
                              ...styles.badgeDesignation,
                            }}
                          >
                            {employee.designation}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.badge,
                              ...styles.badgeDepartment,
                            }}
                          >
                            {employee.department_name || "—"}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.companyInfo}>
                            <FaBuilding style={styles.icon} />
                            <span>{employee.company_name}</span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {employee.blood_group ? (
                            <span
                              style={{
                                ...styles.bloodGroup,
                                ...getBloodGroupStyle(employee.blood_group),
                              }}
                            >
                              <FaTint style={styles.icon} />
                              {employee.blood_group}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.birthdateInfo}>
                            <FaBirthdayCake style={styles.icon} />
                            {formatDateForDisplay(employee.date_of_birth) ||
                              "—"}
                            {birthdateFilter &&
                              checkBirthdateMatch(
                                employee.date_of_birth,
                                birthdateFilter,
                              ) && (
                                <span
                                  style={styles.birthdayIndicator}
                                  title="Birthday today!"
                                >
                                  🎂
                                </span>
                              )}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.actionButtons}>
                            <button
                              style={{
                                ...styles.actionBtn,
                                ...styles.actionBtnAttachment,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/employee/${employee.id}/attachments`,
                                );
                              }}
                              title="Attachments"
                            >
                              <FaPaperclip />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr style={styles.emptyRow}>
                      <td colSpan="9" style={{ padding: "60px 20px" }}>
                        <div style={styles.emptyState}>
                          <FaUsers style={styles.emptyIcon} />
                          <h4 style={{ fontSize: "18px", color: "#334155" }}>
                            No employees found
                          </h4>
                          <p style={{ color: "#64748b", marginBottom: "8px" }}>
                            Try adjusting your search or filters
                          </p>
                          <button
                            style={styles.btnOutline}
                            onClick={clearAllFilters}
                          >
                            Clear filters
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
              <div style={styles.pagination}>
                <button
                  style={styles.paginationBtn}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                </button>
                <div style={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 2 && page <= currentPage + 2)
                        return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <span style={styles.ellipsis}>...</span>
                            <button
                              style={{
                                ...styles.pageNumber,
                                ...(currentPage === page
                                  ? styles.pageNumberActive
                                  : {}),
                              }}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      }
                      return (
                        <button
                          key={page}
                          style={{
                            ...styles.pageNumber,
                            ...(currentPage === page
                              ? styles.pageNumberActive
                              : {}),
                          }}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>
                <button
                  style={styles.paginationBtn}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
  },
  mainContent: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
    height: "100vh",
  },
  employeeDashboard: {
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "white",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#475569",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "6px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "#2563eb",
    color: "white",
  },
  btnExport: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "6px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#334155",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "6px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #cbd5e1",
    background: "transparent",
    color: "#475569",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "8px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  statIconBlue: {
    background: "#dbeafe",
    color: "#2563eb",
  },
  statIconPurple: {
    background: "#ede9fe",
    color: "#7c3aed",
  },
  statIconGreen: {
    background: "#d1fae5",
    color: "#10b981",
  },
  statIconOrange: {
    background: "#fed7aa",
    color: "#f59e0b",
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#0f172a",
  },
  filtersSection: {
    background: "white",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
  },
  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  filtersTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  clearFilters: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#475569",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: "12px",
  },
  searchWrapper: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "14px",
  },
  searchInput: {
    width: "100%",
    height: "40px",
    padding: "0 12px 0 36px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
  },
  clearSearch: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  filterWrapper: {
    position: "relative",
  },
  filterSelect: {
    height: "40px",
    padding: "0 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    background: "white",
    transition: "all 0.2s",
  },
  filterSelectActive: {
    borderColor: "#2563eb",
  },
  placeholder: {
    color: "#94a3b8",
  },
  chevron: {
    color: "#94a3b8",
    fontSize: "12px",
    transition: "transform 0.2s",
  },
  selectIcons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  clearIcon: {
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "12px",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    maxHeight: "300px",
    overflow: "hidden",
  },
  datePicker: {
    padding: "12px",
  },
  dateInput: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },
  dropdownSearch: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdownSearchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
  },
  dropdownOptions: {
    maxHeight: "250px",
    overflowY: "auto",
  },
  dropdownOption: {
    padding: "10px 12px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  dropdownOptionSelected: {
    background: "#2563eb",
    color: "white",
  },
  activeFilters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  filterTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#334155",
  },
  filterTagButton: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
  },
  tableSection: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  resultCount: {
    padding: "4px 10px",
    background: "#f1f5f9",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#475569",
  },
  selectionInfo: {
    fontSize: "14px",
    color: "#64748b",
  },
  tableContainer: {
    overflowX: "auto",
  },
  employeeTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
  },
  tableHeaderCell: {
    padding: "14px 20px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 500,
    color: "#64748b",
    background: "#f9fafb",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  sortable: {
    cursor: "pointer",
    userSelect: "none",
  },
  checkboxCell: {
    width: "40px",
    textAlign: "center",
    padding: "14px 20px",
  },
  checkbox: {
    position: "relative",
    display: "inline-block",
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  checkboxInput: {
    position: "absolute",
    opacity: 0,
    cursor: "pointer",
    height: 0,
    width: 0,
  },
  checkmark: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "18px",
    width: "18px",
    backgroundColor: "white",
    border: "2px solid #cbd5e1",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  tableCell: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#334155",
  },
  employeeRow: {
    transition: "background 0.2s",
  },
  employeeRowSelected: {
    background: "#eff6ff",
  },
  employeeId: {
    fontWeight: 500,
    color: "#2563eb",
  },
  employeeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  employeeAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "20px",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  employeeDetails: {
    display: "flex",
    flexDirection: "column",
  },
  employeeName: {
    fontWeight: 500,
    color: "#0f172a",
  },
  employeeEmail: {
    fontSize: "12px",
    color: "#64748b",
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },
  badgeDesignation: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  badgeDepartment: {
    background: "#f3e8ff",
    color: "#9333ea",
  },
  companyInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  icon: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  bloodGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 500,
  },
  bloodGroupApositive: { color: "#2563eb" },
  bloodGroupBpositive: { color: "#7c3aed" },
  bloodGroupOpositive: { color: "#059669" },
  bloodGroupABpositive: { color: "#b45309" },
  birthdateInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  birthdayIndicator: {
    marginLeft: "4px",
    animation: "bounce 2s infinite",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  actionBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  actionBtnAttachment: {
    "&:hover": {
      background: "#fff3cd",
      color: "#f59e0b",
    },
  },
  emptyRow: {
    textAlign: "center",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#cbd5e1",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "20px",
    borderTop: "1px solid #e2e8f0",
  },
  paginationBtn: {
    width: "36px",
    height: "36px",
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  pageNumbers: {
    display: "flex",
    gap: "4px",
  },
  pageNumber: {
    minWidth: "36px",
    height: "36px",
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  pageNumberActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  ellipsis: {
    padding: "0 4px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "20px",
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    background: "#fee2e2",
    color: "#ef4444",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .sort-icon {
    margin-left: 4px;
    font-size: 12px;
    color: #94a3b8;
  }
  .sort-icon.active {
    color: #2563eb;
  }
  .filter-select.active .chevron {
    transform: rotate(180deg);
  }
  .employee-row:hover {
    background: #f8fafc;
  }
  .action-btn:hover {
    background: #e2e8f0;
    color: #334155;
  }
  .action-btn.attachment:hover {
    background: #fff3cd;
    color: #f59e0b;
  }
  .pagination-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #0f172a;
  }
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .page-number:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  .filter-select:hover, .filter-select.active {
    border-color: #2563eb;
  }
  .checkbox:hover input ~ .checkmark {
    border-color: #2563eb;
  }
  .checkbox input:checked ~ .checkmark {
    background-color: #2563eb;
    border-color: #2563eb;
  }
  .checkbox input:checked ~ .checkmark:after {
    display: block;
  }
  .checkbox .checkmark:after {
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    content: "";
    position: absolute;
    display: none;
  }
  .dropdown-option:hover {
    background: #f1f5f9;
  }
  .clear-filters:hover {
    background: #e2e8f0;
    color: #ef4444;
  }
  .clear-search:hover {
    color: #ef4444;
  }
  .clear-icon:hover {
    color: #ef4444;
  }
  .filter-tag button:hover {
    color: #ef4444;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
  .btn-primary:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }
  .btn-export:hover {
    background: #f9fafb;
    border-color: #cbd5e1;
  }
  .btn-outline:hover {
    background: #f1f5f9;
  }
  .search-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  .date-input:focus {
    outline: none;
    border-color: #2563eb;
  }
  .dropdown-search input:focus {
    outline: none;
  }
  .table-header-cell.sortable:hover {
    color: #2563eb;
  }
`;
document.head.appendChild(styleSheet);

export default EmployeeDetails;
