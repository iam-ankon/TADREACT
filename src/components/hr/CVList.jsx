import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaBarcode,
  FaSearch,
} from "react-icons/fa";

const CVList = () => {
  const [cvs, setCvs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const cvsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://119.148.51.38:8000/api/hrms/api/CVAdd/")
      .then((res) => setCvs(res.data))
      .catch((err) => console.error("Error fetching CVs:", err));
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this CV?")) {
      try {
        await axios.delete(
          `http://119.148.51.38:8000/api/hrms/api/CVAdd/${id}/`
        );
        setCvs(cvs.filter((cv) => cv.id !== id));
      } catch (error) {
        console.error("Error deleting CV:", error);
      }
    }
  };

  const handleEdit = (id) => navigate(`/cv-edit/${id}`);

  const filteredCvs = cvs.filter((cv) =>
    cv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastCv = currentPage * cvsPerPage;
  const indexOfFirstCv = indexOfLastCv - cvsPerPage;
  const currentCvs = filteredCvs.slice(indexOfFirstCv, indexOfLastCv);
  const totalPages = Math.ceil(filteredCvs.length / cvsPerPage);

  return (
    <div style={styles.container}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={styles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <h2 style={styles.heading}>All CVs</h2>

          {/* Search and Add CV */}
          <div style={responsiveStyles.responsiveFlex}>
            <div style={responsiveStyles.responsiveColumn}>
              <label style={labelStyle}>Search by Name:</label>
              <div style={styles.searchBox}>
                <FaSearch />
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={responsiveStyles.responsiveColumn}>
              <Link to="/cv-add" style={btnStyle("#0078D4")}>
                Add CV
              </Link>
            </div>
          </div>

          {/* Table Wrapper */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: "#e1e9f3" }}>
                  <th style={cellStyle}>Name</th>
                  <th style={cellStyle}>Position</th>
                  <th style={cellStyle}>Age</th>
                  <th style={cellStyle}>Email</th>
                  <th style={cellStyle}>Phone</th>
                  <th style={cellStyle}>Reference</th>
                  <th style={cellStyle}>CV</th>
                  <th style={cellStyle}>QR Code</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCvs.length > 0 ? (
                  currentCvs.map((cv) => (
                    <tr key={cv.id}>
                      <td style={cellStyle}>{cv.name}</td>
                      <td style={cellStyle}>{cv.position_for}</td>
                      <td style={cellStyle}>{cv.age}</td>
                      <td style={cellStyle}>{cv.email}</td>
                      <td style={cellStyle}>{cv.phone}</td>
                      <td style={cellStyle}>{cv.reference}</td>
                      <td style={cellStyle}>
                        <a
                          href={cv.cv_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={linkStyle}
                        >
                          <FaFilePdf /> View
                        </a>
                      </td>
                      <td style={cellStyle}>
                        <Link to={`/cv-detail/${cv.id}`} style={linkStyle}>
                          <FaBarcode />
                        </Link>
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleEdit(cv.id)}
                          style={{
                            ...actionButton,
                            backgroundColor: "#ffaa00",
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(cv.id)}
                          style={{
                            ...actionButton,
                            backgroundColor: "#ff4d4d",
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      style={{ ...cellStyle, textAlign: "center" }}
                    >
                      No CVs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === 1 && styles.disabledPageButton),
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>

              {/* Always show first page */}
              <button
                onClick={() => setCurrentPage(1)}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === 1 && styles.activePageButton),
                }}
              >
                1
              </button>

              {/* Show ellipsis after first page if needed */}
              {currentPage > 4 && <span style={styles.ellipsis}>...</span>}

              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, totalPages - 2) }, (_, i) => {
                let page;
                if (currentPage <= 4) {
                  // Near the beginning: show pages 2,3,4,5,6
                  page = i + 2;
                } else if (currentPage >= totalPages - 3) {
                  // Near the end: show pages totalPages-5 to totalPages-1
                  page = totalPages - 4 + i;
                } else {
                  // Middle: show currentPage-2 to currentPage+2
                  page = currentPage - 2 + i;
                }

                // Ensure page is within valid range and not first/last page
                if (page > 1 && page < totalPages) {
                  return (
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
                  );
                }
                return null;
              }).filter(Boolean)}

              {/* Show ellipsis before last page if needed */}
              {currentPage < totalPages - 3 && (
                <span style={styles.ellipsis}>...</span>
              )}

              {/* Always show last page if there's more than 1 page */}
              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === totalPages && styles.activePageButton),
                  }}
                >
                  {totalPages}
                </button>
              )}

              {/* Next Button */}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === totalPages && styles.disabledPageButton),
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================
// Styles
// =====================
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#A7D5E1",
  },
  mainContent: {
    padding: "2rem",
    flex: 1,
    width: "10%",
    boxSizing: "border-box",
    overflowY: "auto",
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
    minWidth: "1000px", // ensures scroll for portrait
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
    backgroundColor: "green",
  },
  activePageButton: {
    backgroundColor: "",
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
  textDecoration: "none",
  display: "inline-block",
  width: "100%",
  maxWidth: "200px",
});

const actionButton = {
  color: "white",
  padding: "5px 10px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  marginRight: "8px",
};

const linkStyle = {
  color: "#0078D4",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "0.9rem",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
};

export default CVList;
