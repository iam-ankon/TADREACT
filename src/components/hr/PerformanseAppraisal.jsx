import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { getPerformanceAppraisals, deletePerformanceAppraisal } from "../../api/employeeApi";

const PerformanseAppraisal = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const appraisalsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    try {
      setLoading(true);
      const response = await getPerformanceAppraisals();
      setAppraisals(response.data);
    } catch (error) {
      console.error("Error fetching appraisals:", error);
      alert("Failed to load appraisals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this appraisal?")) {
      try {
        await deletePerformanceAppraisal(id);
        setAppraisals(appraisals.filter((a) => a.id !== id));
        alert("Appraisal deleted successfully!");
      } catch (error) {
        console.error("Error deleting appraisal:", error);
        alert("Failed to delete appraisal. Please try again.");
      }
    }
  };

  const filteredAppraisals = appraisals.filter(
    (appraisal) =>
      appraisal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appraisal.employee_id?.toString().includes(searchQuery)
  );

  const indexOfLast = currentPage * appraisalsPerPage;
  const indexOfFirst = indexOfLast - appraisalsPerPage;
  const currentAppraisals = filteredAppraisals.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAppraisals.length / appraisalsPerPage);

  return (
    <div style={styles.container}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={styles.mainContent}>
          <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <h2 style={styles.heading}>Performance Appraisal</h2>

            <div style={responsiveStyles.responsiveFlex}>
              <div style={responsiveStyles.responsiveColumn}>
                <label style={labelStyle}>Search by Name or ID:</label>
                <div style={styles.searchBox}>
                  🔍
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={responsiveStyles.responsiveColumn}>
                <Link to="/add-newAppraisal" style={btnStyle("#0078D4")}>
                  + Add New Appraisal
                </Link>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>Loading appraisals...</div>
            ) : (
              <>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={{ backgroundColor: "#e1e9f3" }}>
                        <th style={cellStyle}>Employee ID</th>
                        <th style={cellStyle}>Name</th>
                        <th style={cellStyle}>Designation</th>
                        <th style={cellStyle}>Department</th>
                        {/* <th style={cellStyle}>Last Increment</th>
                        <th style={cellStyle}>Last Promotion</th> */}
                        <th style={cellStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAppraisals.length > 0 ? (
                        currentAppraisals.map((appraisal) => (
                          <tr
                            key={appraisal.id}
                            onClick={() =>
                              navigate(`/appraisal-details/${appraisal.id}`)
                            }
                            style={{
                              backgroundColor: "#fff",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#eef6ff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "#fff")
                            }
                          >
                            <td style={cellStyle}>{appraisal.employee_id}</td>
                            <td style={cellStyle}>{appraisal.name}</td>
                            <td style={cellStyle}>{appraisal.designation}</td>
                            <td style={cellStyle}>{appraisal.department_name}</td>
                            {/* <td style={cellStyle}>
                              {appraisal.last_increment_date}
                            </td>
                            <td style={cellStyle}>
                              {appraisal.last_promotion_date}
                            </td> */}
                            <td style={cellStyle}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/edit-appraisal/${appraisal.id}`);
                                }}
                                style={{
                                  ...actionButton,
                                  backgroundColor: "#28a745",
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleDelete(appraisal.id, e)}
                                style={{
                                  ...actionButton,
                                  backgroundColor: "#dc3545",
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            style={{ ...cellStyle, textAlign: "center" }}
                          >
                            {searchQuery ? "No matching appraisals found." : "No appraisal records found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={styles.pagination}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
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
                      )
                    )}
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

// ========== STYLES ==========
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
  loading: {
    textAlign: "center",
    padding: "20px",
    fontSize: "16px",
    color: "#666",
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
  textDecoration: "none",
  display: "inline-block",
  width: "100%",
  maxWidth: "200px",
});

const cellStyle = {
  border: "1px solid #d1dbe8",
  padding: "10px",
  textAlign: "center",
};

const actionButton = {
  color: "white",
  padding: "6px 10px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  marginRight: "8px",
  fontSize: "14px",
};

export default PerformanseAppraisal;