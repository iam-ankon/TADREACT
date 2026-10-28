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
import styles from "./EmployeeDetails.module.css";
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

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
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
  const [allCompanies, setAllCompanies] = useState([]);

  // Filter state - Initialize with values from localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem("employeeSearchQuery") || "";
    } catch {
      return "";
    }
  });
  const [companyFilter, setCompanyFilter] = useState(() => {
    try {
      return localStorage.getItem("employeeCompanyFilter") || "";
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
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
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
  // Every keystroke/filter change fires a new fetch immediately (no
  // debounce), so responses can arrive out of order (e.g. a broad "M" search
  // resolving after a narrower "Mia" one). Only the most recently STARTED
  // request's response is allowed to update state - otherwise the table
  // (and Export CSV, which reads the same `employees` state) can end up
  // showing a stale, broader result set than what's actually typed.
  const latestRequestId = useRef(0);

  // Refs for dropdowns
  const companyDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const birthdateDropdownRef = useRef(null);

  // Build filter parameters for API
  const buildFilterParams = useCallback(() => {
    const params = {};

    if (searchQuery) params.search = searchQuery;
    if (companyFilter) params.company = companyFilter;
    if (departmentFilter) params.department = departmentFilter;

    // Fix birthday filter - send month and day separately
    if (birthdateFilter) {
      const [year, month, day] = birthdateFilter.split("-");
      // Send month and day as separate parameters
      params.birth_month = parseInt(month, 10);
      params.birth_day = parseInt(day, 10);

    }

    // Add sorting
    if (sortConfig.key) {
      params.ordering =
        sortConfig.direction === "desc" ? `-${sortConfig.key}` : sortConfig.key;
    }

    return params;
  }, [
    searchQuery,
    companyFilter,
    departmentFilter,
    birthdateFilter,
    sortConfig,
  ]);

  // Fetch employees with pagination and filters
  useEffect(() => {
    const requestId = ++latestRequestId.current;

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

        if (requestId !== latestRequestId.current) return; // a newer request has since started - ignore this stale response

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

        // Fetch unique designations, departments and companies for filters (only once)
        if (allDesignations.length === 0 || allDepartments.length === 0 || allCompanies.length === 0) {
          const allResponse = await getEmployees(1, 1000, {
            allPages: true,
            fields: ["designation", "department_name", "company_name"],
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
          const companies = [
            ...new Set(allData.map((emp) => emp.company_name).filter(Boolean)),
          ].sort();

          setAllCompanies(companies);
          setAllDesignations(designations);
          setAllDepartments(departments);
        }
      } catch (error) {
        if (requestId !== latestRequestId.current) return;
        console.error("Error fetching employees:", error);
        setError("Failed to load employees. Please try again.");
        setEmployees([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (requestId === latestRequestId.current) {
          setLoading(false);
          setIsFiltering(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchEmployees();
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    companyFilter,
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
        localStorage.setItem("employeeCompanyFilter", companyFilter);
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
    companyFilter,
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
    companyFilter,
    departmentFilter,
    birthdateFilter,
    sortConfig,
  ]);

  // Filtered lists for dropdowns
  const filteredCompanies = useMemo(() => {
    return allCompanies.filter((company) =>
      company.toLowerCase().includes(companySearch.toLowerCase()),
    );
  }, [allCompanies, companySearch]);

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

    const blob = new Blob(["﻿" + csvContent], {
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
    setCompanyFilter("");
    setDepartmentFilter("");
    setBirthdateFilter("");
    setCurrentPage(1);
  }, []);

  const closeDropdowns = useCallback(() => {
    setShowCompanyDropdown(false);
    setShowDepartmentDropdown(false);
    setShowBirthdatePicker(false);
    setCompanySearch("");
    setDepartmentSearch("");
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideCompany =
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target);
      const isOutsideDepartment =
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target);
      const isOutsideBirthdate =
        birthdateDropdownRef.current &&
        !birthdateDropdownRef.current.contains(event.target);

      if (isOutsideCompany && isOutsideDepartment && isOutsideBirthdate) {
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
    if (sortConfig.key !== key) return <FaSort className={styles.sortIcon} />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className={`${styles.sortIcon} ${styles.sortIconActive}`} />
    ) : (
      <FaSortDown className={`${styles.sortIcon} ${styles.sortIconActive}`} />
    );
  };

  const getBloodGroupClass = (bloodGroup) => {
    const normalizedGroup = bloodGroup?.toLowerCase().replace(/\s+/g, "");
    if (normalizedGroup?.includes("ab")) return styles.bloodAB;
    if (normalizedGroup?.includes("a")) return styles.bloodA;
    if (normalizedGroup?.includes("b")) return styles.bloodB;
    if (normalizedGroup?.includes("o")) return styles.bloodO;
    return styles.bloodDefault;
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
      <div className={styles.paginationContainer}>
        <div className={styles.paginationInfo}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          records
          {isFiltering && <span className={styles.filteringIndicator}> ⟳</span>}
        </div>

        <div className={styles.paginationControls}>
          <div className={styles.pageSizeSelector}>
            <span className={styles.pageSizeLabel}>Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className={styles.pageSizeSelect}
            >
              {[100, 250, 500, 1000].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className={styles.paginationButtons}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              ‹
            </button>

            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className={styles.paginationButton}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className={styles.paginationEllipsis}>...</span>
                )}
              </>
            )}

            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                className={
                  currentPage === number
                    ? `${styles.paginationButton} ${styles.paginationButtonActive}`
                    : styles.paginationButton
                }
              >
                {number}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className={styles.paginationEllipsis}>...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={styles.paginationButton}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
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
      <div className={styles.appContainer}>
        <Sidebars />
        <div className={styles.mainContent}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.appContainer}>
        <Sidebars />
        <div className={styles.mainContent}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>!</div>
            <h3 className={styles.errorTitle}>Unable to load data</h3>
            <p className={styles.errorMessage}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.btnPrimary}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <Sidebars />
      <div className={styles.mainContent}>
        <div className={styles.employeeDashboard}>
          {/* Header Section */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>Employees</h1>
              <div className={styles.headerBadge}>
                <FaUsers />
                <span>{totalItems} Total</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnExport} onClick={handleExport}>
                <FaDownload /> Export CSV
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate("/add-employee")}
              >
                <FaPlus /> Add Employee
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <FaUsers />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Total Employees</span>
                <span className={styles.statValue}>{totalItems}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                <FaLayerGroup />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Departments</span>
                <span className={styles.statValue}>{allDepartments.length}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <FaBriefcase />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Designations</span>
                <span className={styles.statValue}>{allDesignations.length}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
                <FaFilter />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Current Page</span>
                <span className={styles.statValue}>{employees.length}</span>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersHeader}>
              <div className={styles.filtersTitle}>
                <FaFilter className={styles.filtersTitleIcon} />
                <h3 className={styles.filtersTitleText}>Filters</h3>
              </div>
              {(searchQuery ||
                companyFilter ||
                departmentFilter ||
                birthdateFilter) && (
                <button className={styles.clearFilters} onClick={clearAllFilters}>
                  <FaTimes /> Clear all
                </button>
              )}
            </div>

            <div className={styles.filtersGrid}>
              {/* Search */}
              <div className={styles.searchWrapper}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery("")}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Company Filter */}
              <div className={styles.filterWrapper} ref={companyDropdownRef}>
                <div
                  className={`${styles.filterSelect} ${showCompanyDropdown ? styles.filterSelectActive : ""}`}
                  onClick={() => {
                    setShowCompanyDropdown(!showCompanyDropdown);
                    setShowDepartmentDropdown(false);
                    setShowBirthdatePicker(false);
                  }}
                >
                  <span className={companyFilter ? "" : styles.placeholder}>
                    {companyFilter || "All Companies"}
                  </span>
                  <FaChevronDown
                    className={`${styles.chevron} ${showCompanyDropdown ? styles.chevronOpen : ""}`}
                  />
                </div>
                {showCompanyDropdown && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownSearch}>
                      <FaSearch className={styles.dropdownSearchIcon} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        className={styles.dropdownSearchInput}
                        autoFocus
                      />
                    </div>
                    <div className={styles.dropdownOptions}>
                      <div
                        className={`${styles.dropdownOption} ${!companyFilter ? styles.dropdownOptionSelected : ""}`}
                        onClick={() => {
                          setCompanyFilter("");
                          setShowCompanyDropdown(false);
                        }}
                      >
                        All Companies
                      </div>
                      {filteredCompanies.map((company) => (
                        <div
                          key={company}
                          className={`${styles.dropdownOption} ${companyFilter === company ? styles.dropdownOptionSelected : ""}`}
                          onClick={() => {
                            setCompanyFilter(company);
                            setShowCompanyDropdown(false);
                          }}
                        >
                          {company}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Department Filter */}
              <div className={styles.filterWrapper} ref={departmentDropdownRef}>
                <div
                  className={`${styles.filterSelect} ${showDepartmentDropdown ? styles.filterSelectActive : ""}`}
                  onClick={() => {
                    setShowDepartmentDropdown(!showDepartmentDropdown);
                    setShowCompanyDropdown(false);
                    setShowBirthdatePicker(false);
                  }}
                >
                  <span className={departmentFilter ? "" : styles.placeholder}>
                    {departmentFilter || "All Departments"}
                  </span>
                  <FaChevronDown
                    className={`${styles.chevron} ${showDepartmentDropdown ? styles.chevronOpen : ""}`}
                  />
                </div>
                {showDepartmentDropdown && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownSearch}>
                      <FaSearch className={styles.dropdownSearchIcon} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        className={styles.dropdownSearchInput}
                        autoFocus
                      />
                    </div>
                    <div className={styles.dropdownOptions}>
                      <div
                        className={`${styles.dropdownOption} ${!departmentFilter ? styles.dropdownOptionSelected : ""}`}
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
                          className={`${styles.dropdownOption} ${departmentFilter === department ? styles.dropdownOptionSelected : ""}`}
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
              <div className={styles.filterWrapper} ref={birthdateDropdownRef}>
                <div
                  className={`${styles.filterSelect} ${showBirthdatePicker ? styles.filterSelectActive : ""}`}
                  onClick={() => {
                    setShowBirthdatePicker(!showBirthdatePicker);
                    setShowCompanyDropdown(false);
                    setShowDepartmentDropdown(false);
                  }}
                >
                  <span className={birthdateFilter ? "" : styles.placeholder}>
                    {birthdateFilter
                      ? formatDateForDisplay(birthdateFilter)
                      : "Birth Date (Month/Day)"}
                  </span>
                  <div className={styles.selectIcons}>
                    {birthdateFilter && (
                      <FaTimes
                        className={styles.clearIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBirthdateFilter("");
                        }}
                      />
                    )}
                    <FaCalendarAlt className={styles.calendarIcon} />
                  </div>
                </div>
                {showBirthdatePicker && (
                  <div className={`${styles.dropdownMenu} ${styles.datePicker}`}>
                    <div className={styles.datePickerHint}>
                      Select any date (only month and day will be used)
                    </div>
                    <input
                      type="date"
                      value={birthdateFilter}
                      onChange={(e) => {
                        setBirthdateFilter(e.target.value);
                        setShowBirthdatePicker(false);
                      }}
                      className={styles.dateInput}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {(companyFilter || departmentFilter || birthdateFilter) && (
              <div className={styles.activeFilters}>
                {companyFilter && (
                  <span className={styles.filterTag}>
                    Company: {companyFilter}
                    <button
                      className={styles.filterTagButton}
                      onClick={() => setCompanyFilter("")}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {departmentFilter && (
                  <span className={styles.filterTag}>
                    Department: {departmentFilter}
                    <button
                      className={styles.filterTagButton}
                      onClick={() => setDepartmentFilter("")}
                    >
                      <FaTimes />
                    </button>
                  </span>
                )}
                {birthdateFilter && (
                  <span className={styles.filterTag}>
                    Birth Date: {formatDateForDisplay(birthdateFilter)}
                    <button
                      className={styles.filterTagButton}
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
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                <h3 className={styles.tableTitleText}>Employee Directory</h3>
                <span className={styles.resultCount}>
                  {totalItems} total records
                </span>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.employeeTable}>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("employee_id")}
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                    >
                      ID {getSortIcon("employee_id")}
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                    >
                      Employee {getSortIcon("name")}
                    </th>
                    <th
                      onClick={() => handleSort("designation")}
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                    >
                      Designation {getSortIcon("designation")}
                    </th>
                    <th
                      onClick={() => handleSort("department_name")}
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                    >
                      Department {getSortIcon("department_name")}
                    </th>
                    <th className={styles.tableHeaderCell}>Company</th>
                    <th className={styles.tableHeaderCell}>Blood Group</th>
                    <th className={styles.tableHeaderCell}>Joining Date</th>
                    <th className={styles.tableHeaderCell}>Birth Date</th>
                    <th className={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className={`${styles.employeeRow} ${selectedRows.includes(employee.id) ? styles.employeeRowSelected : ""}`}
                      >
                        <td className={styles.tableCell}>
                          <span className={styles.employeeId}>
                            {employee.employee_id}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <div
                            className={styles.employeeInfo}
                            onClick={() => handleRowClick(employee.id)}
                          >
                            <div className={styles.employeeAvatar}>
                              {employee.image1 ? (
                                <img
                                  src={employee.image1}
                                  alt={employee.name}
                                  className={styles.avatarImage}
                                />
                              ) : (
                                <span className={styles.avatarInitial}>
                                  {employee.name
                                    ? employee.name.charAt(0).toUpperCase()
                                    : <FaUserCircle />}
                                </span>
                              )}
                            </div>
                            <div className={styles.employeeDetails}>
                              <div className={styles.employeeName}>
                                {employee.name}
                              </div>
                              <div className={styles.employeeEmail}>
                                {employee.email || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.badge} ${styles.badgeDesignation}`}>
                            {employee.designation}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.badge} ${styles.badgeDepartment}`}>
                            {employee.department_name || "—"}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.companyInfo}>
                            <FaBuilding className={styles.icon} />
                            <span>{employee.company_name}</span>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          {employee.blood_group ? (
                            <span
                              className={`${styles.bloodGroup} ${getBloodGroupClass(employee.blood_group)}`}
                            >
                              <FaTint className={styles.icon} />
                              {employee.blood_group}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.joiningDateInfo}>
                            <FaCalendarAlt className={styles.icon} />
                            {formatDateForDisplay(employee.joining_date) || "—"}
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.birthdateInfo}>
                            <FaBirthdayCake className={styles.icon} />
                            {formatDateForDisplay(employee.date_of_birth) ||
                              "—"}
                            {birthdateFilter &&
                              checkBirthdateMatch(
                                employee.date_of_birth,
                                birthdateFilter,
                              ) && (
                                <span
                                  className={styles.birthdayIndicator}
                                  title="Birthday today!"
                                >
                                  🎂
                                </span>
                              )}
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.actionBtn}
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
                    <tr className={styles.emptyRow}>
                      <td colSpan="9">
                        <div className={styles.emptyState}>
                          <FaUsers className={styles.emptyIcon} />
                          <h4 className={styles.emptyTitle}>
                            No employees found
                          </h4>
                          <p className={styles.emptySubtitle}>
                            Try adjusting your search or filters
                          </p>
                          <button
                            className={styles.btnOutline}
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

export default EmployeeDetails;
