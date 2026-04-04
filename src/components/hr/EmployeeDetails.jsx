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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    try {
      const saved = localStorage.getItem("employeeItemsPerPage");
      return saved ? parseInt(saved) : 100;
    } catch {
      return 100;
    }
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data state
  const [employees, setEmployees] = useState([]);
  const [allDesignations, setAllDesignations] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);

  // Filter state - Initialize with values from localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem("employeeSearchQuery") || "";
    } catch {
      return "";
    }
  });
  const [designationFilter, setDesignationFilter] = useState(() => {
    try {
      return localStorage.getItem("employeeDesignationFilter") || "";
    } catch {
      return "";
    }
  });
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    try {
      return localStorage.getItem("employeeDepartmentFilter") || "";
    } catch {
      return "";
    }
  });
  const [birthdateFilter, setBirthdateFilter] = useState(() => {
    try {
      return localStorage.getItem("employeeBirthdateFilter") || "";
    } catch {
      return "";
    }
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
  const [designationSearch, setDesignationSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [sortConfig, setSortConfig] = useState(() => {
    try {
      return {
        key: localStorage.getItem("employeeSortKey") || "name",
        direction: localStorage.getItem("employeeSortDirection") || "asc",
      };
    } catch {
      return { key: "name", direction: "asc" };
    }
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  const filterTimeoutRef = useRef(null);

  // Refs for dropdowns
  const designationDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const birthdateDropdownRef = useRef(null);

  // Build filter parameters for API
  const buildFilterParams = useCallback(() => {
    const params = {};

    if (searchQuery) params.search = searchQuery;
    if (designationFilter) params.designation = designationFilter;
    if (departmentFilter) params.department = departmentFilter;

    // Fix birthday filter - send month and day separately
    if (birthdateFilter) {
      const [year, month, day] = birthdateFilter.split("-");
      // Send month and day as separate parameters
      params.birth_month = parseInt(month, 10); // Convert to number
      params.birth_day = parseInt(day, 10);

      console.log(`🎂 Birthday filter: Month=${month}, Day=${day}`);
    }

    // Add sorting
    if (sortConfig.key) {
      params.ordering =
        sortConfig.direction === "desc" ? `-${sortConfig.key}` : sortConfig.key;
    }

    console.log("📤 Sending filters to API:", params);
    return params;
  }, [
    searchQuery,
    designationFilter,
    departmentFilter,
    birthdateFilter,
    sortConfig,
  ]);

  // Fetch employees with pagination and filters
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setIsFiltering(true);

        const filters = buildFilterParams();

        // Fetch paginated employees
        const response = await getEmployees(currentPage, itemsPerPage, {
          allPages: false,
          filters,
        });

        // Handle response
        let employeesData = [];
        let total = 0;

        if (response.data && Array.isArray(response.data)) {
          employeesData = response.data;
          total = response.pagination?.count || employeesData.length;
        } else if (response.data && response.data.results) {
          employeesData = response.data.results;
          total = response.data.count || 0;
        }

        setEmployees(employeesData);
        setTotalItems(total);
        setTotalPages(
          response.pagination?.total_pages || Math.ceil(total / itemsPerPage),
        );

        // Fetch unique designations and departments for filters (only once)
        if (allDesignations.length === 0 || allDepartments.length === 0) {
          const allResponse = await getEmployees(1, 1000, {
            allPages: true,
            fields: ["designation", "department_name"],
          });

          let allData = [];
          if (allResponse.data && Array.isArray(allResponse.data)) {
            allData = allResponse.data;
          } else if (allResponse.data && allResponse.data.results) {
            allData = allResponse.data.results;
          }

          const designations = [
            ...new Set(allData.map((emp) => emp.designation).filter(Boolean)),
          ].sort();
          const departments = [
            ...new Set(
              allData.map((emp) => emp.department_name).filter(Boolean),
            ),
          ].sort();

          setAllDesignations(designations);
          setAllDepartments(departments);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employees. Please try again.");
        setEmployees([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
        setIsFiltering(false);
        setIsInitialLoad(false);
      }
    };

    fetchEmployees();
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    designationFilter,
    departmentFilter,
    birthdateFilter,
    sortConfig,
  ]);

  // Save filters to localStorage with debounce
  useEffect(() => {
    // Skip saving on initial mount to avoid overwriting
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
        localStorage.setItem("employeeItemsPerPage", itemsPerPage.toString());
        localStorage.setItem("employeeSortKey", sortConfig.key);
        localStorage.setItem("employeeSortDirection", sortConfig.direction);
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }
    }, 300);
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [
    searchQuery,
    designationFilter,
    departmentFilter,
    birthdateFilter,
    itemsPerPage,
    sortConfig,
  ]);

  // Reset to first page when filters change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      setCurrentPage(1);
    }
  }, [
    searchQuery,
    designationFilter,
    departmentFilter,
    birthdateFilter,
    sortConfig,
  ]);

  // Filtered lists for dropdowns
  const filteredDesignations = useMemo(() => {
    return allDesignations.filter((designation) =>
      designation.toLowerCase().includes(designationSearch.toLowerCase()),
    );
  }, [allDesignations, designationSearch]);

  const filteredDepartments = useMemo(() => {
    return allDepartments.filter((department) =>
      department.toLowerCase().includes(departmentSearch.toLowerCase()),
    );
  }, [allDepartments, departmentSearch]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(employees.map((emp) => emp.id));
    } else if (selectedRows.length === employees.length) {
      setSelectedRows([]);
    }
  }, [selectAll, employees]);

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

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
    if (selectAll) setSelectAll(false);
  };

  const handleExport = useCallback(() => {
    const escapeCSVPhone = (value) => {
      if (value === null || value === undefined || value === "") return "";
      const str = String(value).trim();
      if (/^0[0-9]{9,14}$|^[+][0-9]{10,15}$|^[0-9]{10,15}$/.test(str)) {
        return `="${str}"`;
      }
      if (
        str.includes(",") ||
        str.includes('"') ||
        str.includes("\n") ||
        str.includes("\r")
      ) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

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
        ? employees.filter((emp) => selectedRows.includes(emp.id))
        : employees;

    const companyName = "TAD Group";
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
      "Employee ID,Full Name,Email,Phone Number,Designation,Department,Company,Blood Group,Joining Date",
      ...dataToExport.map((emp) =>
        [
          escapeCSVPhone(emp.employee_id),
          escapeCSV(emp.name),
          escapeCSV(emp.email),
          escapeCSVPhone(emp.personal_phone),
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
  }, [employees, selectedRows]);

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

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

    const normalizedGroup = bloodGroup?.toLowerCase().replace(/\s+/g, "");

    if (normalizedGroup?.includes("a")) return bloodGroupColors["A+"];
    if (normalizedGroup?.includes("b") && !normalizedGroup?.includes("ab"))
      return bloodGroupColors["B+"];
    if (normalizedGroup?.includes("ab")) return bloodGroupColors["AB+"];
    if (normalizedGroup?.includes("o")) return bloodGroupColors["O+"];

    return bloodGroupColors[bloodGroup] || { color: "#334155" };
  };

  // Pagination component
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
      <div style={styles.paginationContainer}>
        <div style={styles.paginationInfo}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          records
          {isFiltering && <span style={styles.filteringIndicator}> ⟳</span>}
        </div>

        <div style={styles.paginationControls}>
          <div style={styles.pageSizeSelector}>
            <span style={styles.pageSizeLabel}>Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={styles.pageSizeSelect}
            >
              {[100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div style={styles.paginationButtons}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={styles.paginationButton}
            >
              ‹
            </button>

            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  style={styles.paginationButton}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span style={styles.paginationEllipsis}>...</span>
                )}
              </>
            )}

            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === number
                    ? styles.paginationButtonActive
                    : {}),
                }}
              >
                {number}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span style={styles.paginationEllipsis}>...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  style={styles.paginationButton}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={styles.paginationButton}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading and error states
  if (loading && employees.length === 0 && isInitialLoad) {
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
                <span>{totalItems} Total</span>
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
                <span style={styles.statValue}>{totalItems}</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
                <FaLayerGroup />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Departments</span>
                <span style={styles.statValue}>{allDepartments.length}</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconGreen }}>
                <FaBriefcase />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Designations</span>
                <span style={styles.statValue}>{allDesignations.length}</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, ...styles.statIconOrange }}>
                <FaFilter />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Current Page</span>
                <span style={styles.statValue}>{employees.length}</span>
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
                      ? formatDateForDisplay(birthdateFilter) // Shows as DD/MM/YYYY but only month/day matters
                      : "Birth Date (Month/Day)"}
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
                    <div
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      Select any date (only month and day will be used)
                    </div>
                    <input
                      type="date"
                      value={birthdateFilter}
                      onChange={(e) => {
                        setBirthdateFilter(e.target.value);
                        setShowBirthdatePicker(false);
                      }}
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
                  {totalItems} total records
                </span>
              </div>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.employeeTable}>
                <thead>
                  <tr>
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
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <tr
                        key={employee.id}
                        style={{
                          ...styles.employeeRow,
                          ...(selectedRows.includes(employee.id)
                            ? styles.employeeRowSelected
                            : {}),
                        }}
                      >
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
                      <td colSpan="8" style={{ padding: "60px 20px" }}>
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
            {totalItems > 0 && <Pagination />}
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
    height: "100vh",
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    padding: "2px 24px",
    overflowY: "auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  employeeDashboard: {
    margin: "0 auto",
    maxWidth: "1590px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2px",
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
    marginTop: "10px",
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
    marginTop: "10px",
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
    marginBottom: "10px",
  },
  statCard: {
    background: "white",
    borderRadius: "8px",
    padding: "10px",
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
    padding: "10px",
    marginBottom: "10px",
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
    display: "flex",
    flexDirection: "column",
    flex: 1,
    marginBottom: "0",
  },
  tableHeader: {
    padding: "10px 10px",
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
    flex: 1,
    minHeight: "300px",
    maxHeight: "calc(100vh - 355px)",
    overflowY: "auto",
  },
  employeeTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1400px",
  },
  tableHeaderCell: {
    padding: "10px 24px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 500,
    color: "#64748b",
    background: "#f9fafb",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  sortable: {
    cursor: "pointer",
    userSelect: "none",
  },
  tableCell: {
    padding: "10px 25px",
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
    gap: "8px",
  },
  actionBtn: {
    display: "flex",
    padding: "10px 18px",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "all 0.2s",
    cursor: "pointer",
    color: "#f59e0b",
    borderColor: "#f59e0b",
    background: "#fff3cd",
    border: "1px solid #e2e8f0",
    marginTop: "4px",
    marginBottom: "5px",
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
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
    flex: 1,
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
    flex: 1,
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
  // Pagination Styles
  paginationContainer: {
    padding: "5px 20px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "auto",
    marginBottom: "0",
  },
  paginationInfo: {
    fontSize: "14px",
    color: "#4a5568",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  filteringIndicator: {
    fontSize: "14px",
    color: "#4299e1",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  pageSizeSelector: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageSizeLabel: {
    fontSize: "14px",
    color: "#4a5568",
  },
  pageSizeSelect: {
    padding: "6px 5px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  paginationButtons: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  paginationButton: {
    padding: "6px 1px",
    border: "1px solid #d1d5db",
    backgroundColor: "white",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#4a5568",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1px",
  },
  paginationButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  paginationEllipsis: {
    padding: "8px 4px",
    color: "#6b7280",
    fontSize: "14px",
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
    border-color: #f59e0b;
  }
  .action-btn.delete:hover {
    background: #fee2e2;
    color: #ef4444;
    border-color: #ef4444;
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
  .pagination-button:hover:not(:disabled) {
    background-color: #f7fafc;
    border-color: #94a3b8;
  }
  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .pagination-button-active {
    background-color: #2563eb;
    border-color: #2563eb;
    color: white;
  }
  
  /* Custom scrollbar styles */
  .table-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .table-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .table-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  .table-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .dropdown-options::-webkit-scrollbar {
    width: 6px;
  }
  
  .dropdown-options::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .dropdown-options::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;
document.head.appendChild(styleSheet);

export default EmployeeDetails;
