import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";

const API_URL = "http://119.148.12.1:8000/api/hrms/api/employees/";

const EmployeeTermination = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 4;
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        setEmployees(employees.filter((emp) => emp.id !== id));
      } catch (error) {
        console.error("Error deleting employee:", error);
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

  return (
    <div style={styles.container}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={styles.mainContent}>
          <h2 style={styles.heading}>Employee Termination</h2>

          {/* Search and Print */}
          <div style={responsiveStyles.responsiveFlex}>
            <div style={responsiveStyles.responsiveColumn}>
              <label style={labelStyle}>Search by Name or ID:</label>
              <div style={styles.searchBox}>
                🔍
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={responsiveStyles.responsiveColumn}>
              <button onClick={handlePrint} style={btnStyle("#0078D4")}>
                🖨️ Print List
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: "#e1e9f3" }}>
                  <th style={cellStyle}>Employee ID</th>
                  <th style={cellStyle}>Name</th>
                  <th style={cellStyle}>Designation</th>
                  <th style={cellStyle}>Department</th>
                  <th style={cellStyle}>Company</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.length > 0 ? (
                  currentEmployees.map((emp, index) => (
                    <tr
                      key={emp.id}
                      onClick={() => handleRowClick(emp.id)}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#eef6ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "#f9f9f9" : "#fff")
                      }
                    >
                      <td style={cellStyle}>{emp.employee_id}</td>
                      <td style={cellStyle}>{emp.name}</td>
                      <td style={cellStyle}>{emp.designation}</td>
                      <td style={cellStyle}>{emp.department}</td>
                      <td style={cellStyle}>{emp.company_name}</td>
                      <td style={cellStyle}>
                        <button
                          style={{ ...actionButton, backgroundColor: "#0078D4" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/attachments/${emp.id}`);
                          }}
                        >
                          📎
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, emp.id)}
                          style={{ ...actionButton, backgroundColor: "#ff4d4d" }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ ...cellStyle, textAlign: "center" }}>
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={styles.pagination}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === page && styles.activePageButton),
                }}
              >
                {page}
              </button>
            ))}
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
    backgroundColor: "#A7D5E1",
    flexDirection: "column",
  },
  mainContent: {
    padding: "2rem",
    flex: 1,
    width: "10%",
    boxSizing: "border-box",
  },
  heading: {
    color: "#0078D4",
    borderBottom: "1px solid #ccc",
    paddingBottom: "10px",
    marginBottom: "20px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1dbe8",
    borderRadius: "4px",
    padding: "5px 10px",
    backgroundColor: "#fff",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: "15px",
    backgroundColor: "#fff",
    borderRadius: "6px",
    boxShadow: "0 0 10px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    minWidth: "1000px",
    borderCollapse: "collapse",
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "14px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: "15px",
    flexWrap: "wrap",
  },
  pageButton: {
    padding: "8px 10px",
    margin: "3px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "white",
  },
  activePageButton: {
    backgroundColor: "#0078D4",
    color: "white",
  },
};

const responsiveStyles = {
  responsiveFlex: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    alignItems: "flex-end",
    marginBottom: "20px",
  },
  responsiveColumn: {
    flex: "1 1 200px",
    minWidth: "200px",
  },
};

const cellStyle = {
  border: "1px solid #d1dbe8",
  padding: "10px",
  textAlign: "center",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "bold",
};

const inputStyle = {
  border: "none",
  outline: "none",
  padding: "6px",
  marginLeft: "8px",
  flex: 1,
};

const btnStyle = (bgColor) => ({
  backgroundColor: bgColor,
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  textAlign: "center",
  display: "inline-block",
  width: "100%",
  maxWidth: "200px",
});

const actionButton = {
  color: "white",
  padding: "6px 10px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  marginRight: "8px",
  fontSize: "14px",
};

export default EmployeeTermination;
