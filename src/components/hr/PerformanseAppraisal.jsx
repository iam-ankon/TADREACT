import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from './sidebars';

const PerformanseAppraisal = () => {
  const [appraisals, setAppraisals] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const appraisalsPerPage = 5;

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    try {
      const response = await axios.get("http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/");
      setAppraisals(response.data);
    } catch (error) {
      console.error("Error fetching appraisals:", error);
    }
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this appraisal?")) {
      try {
        await axios.delete(`http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/${id}/`);
        setAppraisals(appraisals.filter((appraisal) => appraisal.id !== id));
      } catch (error) {
        console.error("Error deleting appraisal:", error);
      }
    }
  };

  const indexOfLastAppraisal = currentPage * appraisalsPerPage;
  const indexOfFirstAppraisal = indexOfLastAppraisal - appraisalsPerPage;
  const currentAppraisals = appraisals.slice(indexOfFirstAppraisal, indexOfLastAppraisal);
  const totalPages = Math.ceil(appraisals.length / appraisalsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.container}>
        <h2 style={styles.title}>Performance Appraisal</h2>

        <Link to="/add-newAppraisal">
          <button style={styles.addButton}>+ Add New Appraisal</button>
        </Link>

        <div style={styles.cardsWrapper}>
          {currentAppraisals.map((appraisal) => (
            <div
              key={appraisal.id}
              style={styles.card}
              onClick={() => navigate(`/appraisal-details/${appraisal.id}`)}
            >
              <div style={styles.cardTop}>
                <div><strong>Employee ID:</strong> {appraisal.employee_id}</div>
                <div><strong>Name:</strong> {appraisal.name}</div>
              </div>
              <div style={styles.cardMiddle}>
                <div><strong>Designation:</strong> {appraisal.designation}</div>
                <div><strong>Department:</strong> {appraisal.department}</div>
              </div>
              <div style={styles.cardBottom}>
                <div><strong>Last Increment:</strong> {appraisal.last_increment_date}</div>
                <div><strong>Last Promotion:</strong> {appraisal.last_promotion_date}</div>
              </div>
              <div style={styles.cardActions}>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/edit-appraisal/${appraisal.id}`);
                  }}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={(event) => handleDelete(appraisal.id, event)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div style={styles.pagination}>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              style={{
                ...styles.pageButton,
                ...(currentPage === pageNumber && styles.activePageButton),
              }}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#A7D5E1",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },

  container: {
    flex: 1,
    padding: "40px",
  },
  title: {
    textAlign: "center",
    color: "#333",
    fontSize: "28px",
    marginBottom: "30px",
  },
  addButton: {
    background: "#0078D4",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "block",
    margin: "0 auto 30px",
    fontSize: "16px",
  },
  cardsWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  cardTop: {
    marginBottom: "10px",
    fontSize: "16px",
  },
  cardMiddle: {
    marginBottom: "10px",
    fontSize: "15px",
    color: "#555",
  },
  cardBottom: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "15px",
  },
  cardActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  editButton: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
  },
  deleteButton: {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  pageButton: {
    padding: "8px 12px",
    margin: "0 5px",
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
const sidebarStyle = {
  width: "235px",
  backgroundColor: "#f3f6fb",
  padding: "20px 15px",
  boxShadow: "2px 0 5px rgba(0, 0, 0, 0.05)",
  flexShrink: 0
};

const sidebarHeaderStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "20px",
  color: "#0078D4"
};

const sidebarLinkStyle = {
  display: "block",
  padding: "10px",
  margin: "5px 0",
  textDecoration: "none",
  color: "#333",
  borderRadius: "6px",
  transition: "0.3s"
};
export default PerformanseAppraisal;