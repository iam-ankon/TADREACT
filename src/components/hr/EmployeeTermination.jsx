import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebars from './sidebars';

const API_URL = "http://119.148.12.1:8000/api/hrms/api/employees/";

const EmployeeTermination = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5; // Keep employees per page as 5

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(API_URL);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/employee/${id}`);
  };

  const handleDelete = async (e, employeeId) => {
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await axios.delete(`${API_URL}${employeeId}/`);
        setEmployees(employees.filter((employee) => employee.id !== employeeId));
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toString().includes(searchTerm)
  );

  const handlePrint = () => {
    window.print();
  };

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const styles = {
    container: {
      display: "flex",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      minHeight: "100vh",
    },
    content: {
      flex: 1,
      padding: "20px",
      backgroundColor: "#f4f4f4",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    searchInput: {
      padding: "10px",
      marginBottom: "15px",
      width: "300px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      backgroundColor: "#fff",
    },
    printButton: {
      padding: "10px 15px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      transition: "background-color 0.3s",
      ':hover': { backgroundColor: '#0056b3' },
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "10px",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#fff",
    },
    th: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "12px 10px",
      textAlign: "left",
    },
    td: {
      padding: "12px 10px",
      textAlign: "left",
      verticalAlign: "middle",
    },
    actionButton: {
      marginRight: "5px",
      padding: "8px 12px",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    deleteButton: {
      backgroundColor: "#dc3545",
      color: "white",
      border: "none",
      ':hover': { backgroundColor: '#c82333' },
    },
    paginationStyle: {
      display: "flex",
      justifyContent: "center",
      marginTop: "20px",
    },
    pageButtonStyle: {
      padding: "8px 12px",
      margin: "0 5px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor: "#fff",
      transition: "background-color 0.3s",
      ':hover': { backgroundColor: '#f0f0f0' },
    },
    activePageButtonStyle: {
      backgroundColor: "#007bff",
      color: "#fff",
      border: "1px solid #007bff",
    },
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.content}>
        <div style={styles.header}>
          <h2>Employee Termination</h2>
          <button style={styles.printButton} onClick={handlePrint}>
            <span role="img" aria-label="print">🖨️</span> Print List
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by Name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Employee ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Designation</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Company</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.map((employee, index) => (
              <tr
                key={employee.id}
                onClick={() => handleRowClick(employee.id)}
                style={{
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eef6ff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    index % 2 === 0 ? "#f9f9f9" : "#ffffff")
                }
              >
                <td style={styles.td}>{employee.employee_id}</td>
                <td style={styles.td}>{employee.name}</td>
                <td style={styles.td}>{employee.designation}</td>
                <td style={styles.td}>{employee.department}</td>
                <td style={styles.td}>{employee.company_name}</td>
                <td style={{ ...styles.td, display: "flex", gap: "5px" }}>
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/attachments/${employee.id}`);
                    }}
                  >
                    <span role="img" aria-label="attachment">📎</span> Attachment
                  </button>
                  <button
                    style={{
                      ...styles.actionButton,
                      ...styles.deleteButton,
                    }}
                    onClick={(e) => handleDelete(e, employee.id)}
                  >
                    <span role="img" aria-label="delete">🗑️</span> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.paginationStyle}>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              style={currentPage === pageNumber ? styles.activePageButtonStyle : styles.pageButtonStyle}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTermination;