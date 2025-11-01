import React, { useEffect, useState, useRef } from "react";
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
} from "react-icons/fa";

const EmployeeDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem("employeeSearchQuery") || "";
    } catch (err) {
      console.error("Error reading searchQuery from localStorage:", err);
      return "";
    }
  });
  const [designationFilter, setDesignationFilter] = useState(() => {
    try {
      return localStorage.getItem("employeeDesignationFilter") || "";
    } catch (err) {
      console.error("Error reading designationFilter from localStorage:", err);
      return "";
    }
  });
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    try {
      return localStorage.getItem("employeeDepartmentFilter") || "";
    } catch (err) {
      console.error("Error reading departmentFilter from localStorage:", err);
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [designationSearch, setDesignationSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = localStorage.getItem("employeeListPage");
      return savedPage ? parseInt(savedPage, 10) : 1;
    } catch (err) {
      console.error("Error reading from localStorage:", err);
      return 1;
    }
  });
  const employeesPerPage = 10;
  const isInitialMount = useRef(true);

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

  // Save search and filter states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("employeeSearchQuery", searchQuery);
      localStorage.setItem("employeeDesignationFilter", designationFilter);
      localStorage.setItem("employeeDepartmentFilter", departmentFilter);
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  }, [searchQuery, designationFilter, departmentFilter]);

  // Skip reset on initial mount to preserve saved page
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
    localStorage.setItem("employeeListPage", "1");
  }, [searchQuery, designationFilter, departmentFilter]);

  // Validate and adjust currentPage
  useEffect(() => {
    if (!employees.length) return;
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
      localStorage.setItem("employeeListPage", totalPages.toString());
    } else if (filteredEmployees.length === 0) {
      setCurrentPage(1);
      localStorage.setItem("employeeListPage", "1");
    }
  }, [
    employees,
    searchQuery,
    designationFilter,
    departmentFilter,
    currentPage,
  ]);

  // Save currentPage to localStorage
  useEffect(() => {
    localStorage.setItem("employeeListPage", currentPage.toString());
  }, [currentPage]);

  const uniqueDesignations = [
    ...new Set(employees.map((emp) => emp.designation).filter(Boolean)),
  ].sort();
  const uniqueDepartments = [
    ...new Set(employees.map((emp) => emp.department_name).filter(Boolean)),
  ].sort();

  const filteredDesignations = uniqueDesignations.filter((designation) =>
    designation.toLowerCase().includes(designationSearch.toLowerCase())
  );
  const filteredDepartments = uniqueDepartments.filter((department) =>
    department.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const filteredEmployees = employees.filter(
    (employee) =>
      employee &&
      (employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employee_id?.toString().includes(searchQuery) ||
        employee.designation
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (employee.department_name &&
          employee.department_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        employee.company_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (employee.blood_group &&
          employee.blood_group
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))) &&
      (designationFilter === "" ||
        employee.designation === designationFilter) &&
      (departmentFilter === "" || employee.department_name === departmentFilter)
  );

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleRowClick = (id) => {
    navigate(`/employee/${id}`);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter((employee) => employee.id !== id));
      } catch (error) {
        console.error("Error deleting employee:", error);
        setError("Failed to delete employee. Please try again.");
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #0078d4; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0078d4; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .print-footer { margin-top: 20px; text-align: right; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Employee List</h1>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Company</th>
                <th>Blood Group</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEmployees
                .map(
                  (employee) => `
                <tr>
                  <td>${employee.employee_id || ""}</td>
                  <td>${employee.name || ""}</td>
                  <td>${employee.designation || ""}</td>
                  <td>${employee.department_name || ""}</td>
                  <td>${employee.company_name || ""}</td>
                  <td>${employee.blood_group ? employee.blood_group : ""}</td>
                  <td>${employee.joining_date || ""}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="print-footer">
            Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const closeDropdowns = () => {
    setShowDesignationDropdown(false);
    setShowDepartmentDropdown(false);
    setDesignationSearch("");
    setDepartmentSearch("");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-input')) {
        closeDropdowns();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (error) {
    return (
      <div className="employee-list-container">
        <Sidebars />
        <div className="content-wrapper">
          <div className="employee-list-card">
            <div className="error-message">{error}</div>
          </div>
        </div>
        <style jsx>{`
          .error-message {
            text-align: center;
            color: #e53935;
            padding: 2rem;
            font-size: 1.2rem;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="employee-list-container">
        <Sidebars />
        <div className="content-wrapper">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-list-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="employee-list-card">
          <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <div className="employee-header">
              <h2>Employee Directory</h2>
              <div className="action-buttons">
                <button
                  onClick={() => navigate("/add-employee")}
                  className="btn-add"
                >
                  <FaPlus /> Add Employee
                </button>
                <button onClick={handlePrint} className="btn-print">
                  <FaPrint /> Print
                </button>
              </div>
            </div>

            <div className="search-container">
              <div className="search-input">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by Name, ID, Company, or Blood Group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Custom Searchable Designation Dropdown */}
              <div className="filter-input">
                <div className="custom-select-wrapper">
                  <div
                    className={`custom-select ${showDesignationDropdown ? 'open' : ''}`}
                    onClick={() => {
                      setShowDesignationDropdown(!showDesignationDropdown);
                      setShowDepartmentDropdown(false);
                      setDepartmentSearch("");
                    }}
                  >
                    <span className="custom-select-value">
                      {designationFilter || "All Designations"}
                    </span>
                    <FaChevronDown className="custom-select-icon" />
                  </div>
                  {showDesignationDropdown && (
                    <div className="custom-dropdown">
                      <input
                        type="text"
                        placeholder="Search designations..."
                        value={designationSearch}
                        onChange={(e) => setDesignationSearch(e.target.value)}
                        className="dropdown-search"
                        autoFocus
                      />
                      <div className="dropdown-options">
                        <div
                          className={`dropdown-option ${!designationFilter ? 'selected' : ''}`}
                          onClick={() => {
                            setDesignationFilter("");
                            closeDropdowns();
                          }}
                        >
                          All Designations
                        </div>
                        {filteredDesignations.map((designation) => (
                          <div
                            key={designation}
                            className={`dropdown-option ${designationFilter === designation ? 'selected' : ''}`}
                            onClick={() => {
                              setDesignationFilter(designation);
                              closeDropdowns();
                            }}
                          >
                            {designation}
                          </div>
                        ))}
                        {filteredDesignations.length === 0 && (
                          <div className="dropdown-option disabled">No designations found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Searchable Department Dropdown */}
              <div className="filter-input">
                <div className="custom-select-wrapper">
                  <div
                    className={`custom-select ${showDepartmentDropdown ? 'open' : ''}`}
                    onClick={() => {
                      setShowDepartmentDropdown(!showDepartmentDropdown);
                      setShowDesignationDropdown(false);
                      setDesignationSearch("");
                    }}
                  >
                    <span className="custom-select-value">
                      {departmentFilter || "All Departments"}
                    </span>
                    <FaChevronDown className="custom-select-icon" />
                  </div>
                  {showDepartmentDropdown && (
                    <div className="custom-dropdown">
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        className="dropdown-search"
                        autoFocus
                      />
                      <div className="dropdown-options">
                        <div
                          className={`dropdown-option ${!departmentFilter ? 'selected' : ''}`}
                          onClick={() => {
                            setDepartmentFilter("");
                            closeDropdowns();
                          }}
                        >
                          All Departments
                        </div>
                        {filteredDepartments.map((department) => (
                          <div
                            key={department}
                            className={`dropdown-option ${departmentFilter === department ? 'selected' : ''}`}
                            onClick={() => {
                              setDepartmentFilter(department);
                              closeDropdowns();
                            }}
                          >
                            {department}
                          </div>
                        ))}
                        {filteredDepartments.length === 0 && (
                          <div className="dropdown-option disabled">No departments found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Company</th>
                    <th>Blood Group</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        onClick={() => handleRowClick(employee.id)}
                        className="employee-row"
                      >
                        <td>{employee.employee_id}</td>
                        <td>{employee.name}</td>
                        <td>{employee.designation}</td>
                        <td>{employee.department_name || "N/A"}</td>
                        <td>{employee.company_name}</td>
                        <td>{employee.blood_group || "N/A"}</td>
                        <td className="action-buttons-cell">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employee/${employee.id}/attachments`);
                            }}
                            className="btn-attachment"
                          >
                            <FaPaperclip />
                          </button>
                          <button
                            onClick={(e) => handleDelete(employee.id, e)}
                            className="btn-delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-results">
                        No employees found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(1)}
                  className={`page-btn ${currentPage === 1 ? "active" : ""}`}
                >
                  1
                </button>
                {currentPage > 4 && <span className="ellipsis">...</span>}
                {Array.from({ length: Math.min(5, totalPages - 2) }, (_, i) => {
                  let page;
                  if (currentPage <= 4) {
                    page = i + 2;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  if (page > 1 && page < totalPages) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`page-btn ${
                          currentPage === page ? "active" : ""
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                {currentPage < totalPages - 3 && (
                  <span className="ellipsis">...</span>
                )}
                {totalPages > 1 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`page-btn ${
                      currentPage === totalPages ? "active" : ""
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`page-btn ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .employee-list-container {
          display: flex;
          min-height: 100vh;
          background-color: #a7d5e1;
          overflow: hidden;
          justify-content: center;
        }

        .content-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          justify-content: center;
        }

        .employee-list-card {
          background: #dceef3;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          margin: 0 auto;
          max-width: 1400px;
        }

        .employee-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 0.5rem;
        }

        .employee-header h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.8rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.8rem;
          align-items: center;
          justify-content: center;
        }

        .action-buttons button {
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
          border: none;
        }

        .btn-add {
          background-color: rgb(75, 154, 214);
          color: white;
        }

        .btn-add:hover {
          background-color: #005a9e;
        }

        .btn-print {
          background-color: #107c10;
          color: white;
        }

        .btn-print:hover {
          background-color: #0e5e0e;
        }

        .search-container {
          margin-bottom: 1.5rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-input,
        .filter-input {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .search-input input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .search-input input:focus {
          outline: none;
          border-color: #0078d4;
        }

        .search-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
        }

        /* Custom Select Styles */
        .custom-select-wrapper {
          position: relative;
          width: 100%;
        }

        .custom-select {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 1rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 0.95rem;
          min-height: 38px;
          transition: all 0.2s;
          user-select: none;
        }

        .custom-select:hover {
          border-color: #0078d4;
        }

        .custom-select.open {
          border-color: #0078d4;
          box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
        }

        .custom-select-value {
          flex: 1;
          color: ${designationFilter || departmentFilter ? '#333' : '#777'};
        }

        .custom-select-icon {
          color: #777;
          transition: transform 0.2s;
        }

        .custom-select.open .custom-select-icon {
          transform: rotate(180deg);
        }

        .custom-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
        }

        .dropdown-search {
          width: 100%;
          padding: 0.8rem 1rem;
          border: none;
          border-bottom: 1px solid #eee;
          font-size: 0.95rem;
          outline: none;
        }

        .dropdown-options {
          max-height: 160px;
          overflow-y: auto;
        }

        .dropdown-option {
          padding: 0.8rem 1rem;
          cursor: pointer;
          font-size: 0.95rem;
          transition: background-color 0.2s;
          border-bottom: 1px solid #f5f5f5;
        }

        .dropdown-option:hover:not(.disabled) {
          background-color: #f0f4f8;
        }

        .dropdown-option.selected {
          background-color: #0078d4;
          color: white;
        }

        .dropdown-option.disabled {
          color: #999;
          cursor: not-allowed;
          background-color: transparent;
        }

        .dropdown-option:last-child {
          border-bottom: none;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .employee-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.1rem;
        }

        .employee-table th {
          background-color: rgb(95, 145, 183);
          color: white;
          padding: 0.4rem 0.5rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .employee-table td {
          padding: 0.3rem 0.5rem;
          border-bottom: 1px solid #eee;
          color: #333;
          text-align: center;
          font-size: 0.85rem;
        }

        .employee-row {
          height: 36px;
          transition: background-color 0.2s;
        }

        .employee-row:hover {
          background-color: #f0f4f8 !important;
          cursor: pointer;
        }

        .employee-row:nth-child(even) {
          background-color: #f9f9f9;
        }

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

        .no-results {
          text-align: center;
          padding: 1.5rem;
          color: #666;
        }

        .pagination {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
          gap: 0.5rem;
        }

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

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #0078d4;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .employee-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .action-buttons {
            width: 100%;
            flex-direction: column;
          }

          .action-buttons button {
            width: 100%;
            justify-content: center;
          }

          .search-input,
          .filter-input {
            max-width: 100%;
          }

          .action-buttons-cell {
            flex-direction: column;
            gap: 0.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetails;