import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { FiSearch, FiPrinter, FiPaperclip, FiTrash2, FiUser } from "react-icons/fi";

const API_URL = "http://119.148.12.1:8000/api/hrms/api/employees/";

const EmployeeTermination = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const employeesPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(API_URL);
        setEmployees(response.data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to terminate ${name}? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        setEmployees(employees.filter((emp) => emp.id !== id));
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to terminate employee. Please try again.");
      }
    }
  };

  const handleRowClick = (id) => {
    navigate(`/employee/${id}`);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toString().includes(searchTerm)
  );

  const indexOfLast = currentPage * employeesPerPage;
  const indexOfFirst = indexOfLast - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePrint = () => window.print();

  // Color palette
  const colors = {
    primary: "#4f46e5",
    primaryLight: "#6366f1",
    danger: "#ef4444",
    dangerLight: "#fee2e2",
    background: "#f8fafc",
    cardBackground: "#ffffff",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    hover: "#f1f5f9",
    success: "#10b981",
    warning: "#f59e0b",
  };

  return (
    <div style={{ ...styles.container, backgroundColor: colors.background }}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}></div>
      </div>
      <div style={styles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto", padding: "1rem" }}>
          <h2 style={{ ...styles.heading, color: colors.primary }}>Employee Termination</h2>

          {/* Search and Print */}
          <div style={styles.controlsContainer}>
            <div style={styles.searchContainer}>
              <div style={{ ...styles.searchBox, borderColor: colors.border }}>
                <FiSearch style={{ color: colors.textSecondary, marginRight: "8px" }} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, color: colors.textPrimary }}
                />
              </div>
            </div>

            <button 
              onClick={handlePrint} 
              style={{ 
                ...styles.printButton,
                backgroundColor: colors.primary,
                ":hover": { backgroundColor: colors.primaryLight }
              }}
            >
              <FiPrinter style={{ marginRight: "8px" }} />
              Print List
            </button>
          </div>

          {/* Status Messages */}
          {loading && (
            <div style={styles.statusMessage}>
              <div style={styles.loadingSpinner}></div>
              Loading employees...
            </div>
          )}
          {error && (
            <div style={{ ...styles.statusMessage, color: colors.danger }}>
              {error}
            </div>
          )}

          {/* Table */}
          <div style={{ ...styles.tableWrapper, backgroundColor: colors.cardBackground }}>
            {!loading && !error && (
              <>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: `${colors.primary}10` }}>
                      <th style={styles.tableHeader}>Employee ID</th>
                      <th style={styles.tableHeader}>Name</th>
                      <th style={styles.tableHeader}>Designation</th>
                      <th style={styles.tableHeader}>Department</th>
                      <th style={styles.tableHeader}>Company</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((emp, index) => (
                        <tr
                          key={emp.id}
                          onClick={() => handleRowClick(emp.id)}
                          style={{
                            backgroundColor: index % 2 === 0 ? colors.cardBackground : colors.hover,
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = colors.hover)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              index % 2 === 0 ? colors.cardBackground : colors.hover)
                          }
                        >
                          <td style={styles.tableCell}>{emp.employee_id || "-"}</td>
                          <td style={styles.tableCell}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <FiUser style={{ marginRight: "8px", color: colors.textSecondary }} />
                              {emp.name || "-"}
                            </div>
                          </td>
                          <td style={styles.tableCell}>{emp.designation || "-"}</td>
                          <td style={styles.tableCell}>{emp.department || "-"}</td>
                          <td style={styles.tableCell}>{emp.company_name || "-"}</td>
                          <td style={styles.tableCell}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <button
                                style={{
                                  ...styles.actionButton,
                                  backgroundColor: `${colors.primary}20`,
                                  color: colors.primary,
                                  ":hover": { backgroundColor: `${colors.primary}30` }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/attachments/${emp.id}`);
                                }}
                                title="View attachments"
                              >
                                <FiPaperclip />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, emp.id, emp.name)}
                                style={{
                                  ...styles.actionButton,
                                  backgroundColor: `${colors.danger}20`,
                                  color: colors.danger,
                                  ":hover": { backgroundColor: `${colors.danger}30` },
                                  marginLeft: "8px"
                                }}
                                title="Terminate employee"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ ...styles.tableCell, textAlign: "center" }}>
                          {searchTerm ? "No matching employees found" : "No employees available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={styles.pagination}>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={styles.paginationButton}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            ...styles.paginationButton,
                            ...(currentPage === pageNum && {
                              backgroundColor: colors.primary,
                              color: "white",
                            }),
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span style={{ padding: "8px 12px" }}>...</span>
                    )}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        style={{
                          ...styles.paginationButton,
                          ...(currentPage === totalPages && {
                            backgroundColor: colors.primary,
                            color: "white",
                          }),
                        }}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={styles.paginationButton}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========= Styles =========
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    margin: "auto",
  },
  mainContent: {
    padding: "1.5rem",
    flex: 1,
    boxSizing: "border-box",
    overflowY: "auto",
  },
  heading: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    borderBottom: "2px solid",
    paddingBottom: "0.5rem",
  },
  controlsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  searchContainer: {
    flex: 1,
    minWidth: "300px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    backgroundColor: "white",
    maxWidth: "400px",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    ":focus-within": {
      borderColor: "#4f46e5",
      boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.2)",
    },
  },
  printButton: {
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "white",
    fontWeight: 500,
    transition: "background-color 0.2s ease",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    borderRadius: "12px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontFamily: "system-ui, sans-serif",
  },
  tableHeader: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: 600,
    color: "#1e293b",
    borderBottom: "1px solid #e2e8f0",
  },
  tableCell: {
    padding: "1rem",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    width: "32px",
    height: "32px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "1.5rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  paginationButton: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "white",
    transition: "background-color 0.2s ease, color 0.2s ease",
    ":hover": {
      backgroundColor: "#f1f5f9",
    },
  },
  statusMessage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
  },
  loadingSpinner: {
    border: "2px solid #e2e8f0",
    borderTop: "2px solid #4f46e5",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    animation: "spin 1s linear infinite",
    marginRight: "8px",
  },
};

const inputStyle = {
  border: "none",
  outline: "none",
  padding: "0",
  flex: 1,
  fontSize: "0.9rem",
  backgroundColor: "transparent",
  "::placeholder": {
    color: "#94a3b8",
  },
};

export default EmployeeTermination;