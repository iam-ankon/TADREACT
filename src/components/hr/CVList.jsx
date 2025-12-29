import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaBarcode,
  FaSearch,
} from "react-icons/fa";
import { getCVs, deleteCV } from "../../api/employeeApi";

const CVList = () => {
  const [cvs, setCvs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cvsPerPage = 10;
  const navigate = useNavigate();

  /* ------------------------------------------------------------------ *
   *  1. Load saved state + fetch CVs (ONLY ON MOUNT)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const savedSearch = localStorage.getItem("cvListSearchQuery") || "";
    const savedPage = parseInt(localStorage.getItem("cvListCurrentPage") || "1", 10);

    setSearchQuery(savedSearch);
    setCurrentPage(savedPage);

    const fetchCVs = async () => {
      try {
        setLoading(true);
        const response = await getCVs();
        const data = response.data;
        setCvs(data);

        const filtered = savedSearch
          ? data.filter((cv) =>
              cv.name.toLowerCase().includes(savedSearch.toLowerCase())
            )
          : data;

        const totalPages = Math.ceil(filtered.length / cvsPerPage);
        const validPage = totalPages > 0 ? Math.min(savedPage, totalPages) : 1;

        setCurrentPage(validPage);
        localStorage.setItem("cvListCurrentPage", validPage.toString());
      } catch (err) {
        console.error("Error fetching CVs:", err);
        setError("Failed to load CVs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCVs();
  }, []); // ← ONLY ONCE

  /* ------------------------------------------------------------------ *
   *  2. Save page & search on every change
   * ------------------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("cvListCurrentPage", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("cvListSearchQuery", searchQuery);
  }, [searchQuery]);

  /* ------------------------------------------------------------------ *
   *  3. Filter CVs (live)
   * ------------------------------------------------------------------ */
  const filteredCvs = cvs.filter((cv) =>
    cv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ------------------------------------------------------------------ *
   *  4. Pagination logic (uses currentPage directly if valid)
   * ------------------------------------------------------------------ */
  const totalPages = Math.ceil(filteredCvs.length / cvsPerPage);
  const validCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const start = (validCurrentPage - 1) * cvsPerPage;
  const end = validCurrentPage * cvsPerPage;
  const currentCvs = filteredCvs.slice(start, end);

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this CV?")) return;
    try {
      await deleteCV(id);
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete CV. Please try again.");
    }
  };

  const handleEdit = (id) => navigate(`/cv-edit/${id}`);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    // Save current page BEFORE changing filter
    localStorage.setItem("cvListCurrentPage", currentPage.toString());
    setSearchQuery(query);
  };

  const clearSearch = () => {
    localStorage.setItem("cvListCurrentPage", currentPage.toString());
    setSearchQuery("");
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    localStorage.setItem("cvListCurrentPage", newPage.toString());
  };

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  return (
    <div style={styles.container}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }} />
      </div>

      <div style={styles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <h2 style={styles.heading}>All CVs</h2>

          {/* Loading State */}
          {loading && (
            <div style={styles.loading}>
              Loading CVs...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {/* Search + Add */}
          {!loading && !error && (
            <>
              <div style={responsiveStyles.responsiveFlex}>
                <div style={responsiveStyles.responsiveColumn}>
                  <label style={labelStyle}>Search by Name:</label>
                  <div style={styles.searchBox}>
                    <FaSearch />
                    <input
                      type="text"
                      placeholder="Enter name..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      style={inputStyle}
                    />
                    {searchQuery && (
                      <button onClick={clearSearch} style={styles.clearInputBtn}>
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div style={responsiveStyles.responsiveColumn}>
                  <Link to="/cv-add" style={btnStyle("#0078D4")}>
                    Add CV
                  </Link>
                </div>
              </div>

              {searchQuery && (
                <div style={styles.searchInfo}>
                  <span>
                    Found {filteredCvs.length} CV(s) matching "{searchQuery}"
                  </span>
                  <button onClick={clearSearch} style={styles.clearSearchBtn}>
                    Clear search
                  </button>
                </div>
              )}

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: "#e1e9f3" }}>
                      <th style={cellStyle}>Name</th>
                      <th style={cellStyle}>Position</th>
                      <th style={cellStyle}>Date Of Birth</th>
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
                            <a href={cv.cv_file} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                              <FaFilePdf /> View
                            </a>
                          </td>
                          <td style={cellStyle}>
                            <Link to={`/cv-detail/${cv.id}`} style={linkStyle}>
                              <FaBarcode />
                            </Link>
                          </td>
                          <td style={cellStyle}>
                            <button onClick={() => handleEdit(cv.id)} style={{ ...actionButton, backgroundColor: "#ffaa00" }}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(cv.id)} style={{ ...actionButton, backgroundColor: "#ff4d4d" }}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" style={{ ...cellStyle, textAlign: "center" }}>
                          {searchQuery ? "No CVs found matching your search." : "No CVs found."}
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
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      ...styles.pageButton,
                      ...(currentPage === 1 && styles.disabledPageButton),
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => handlePageChange(1)}
                    style={{
                      ...styles.pageButton,
                      ...(currentPage === 1 && styles.activePageButton),
                    }}
                  >
                    1
                  </button>

                  {currentPage > 4 && <span style={styles.ellipsis}>...</span>}

                  {Array.from({ length: Math.min(5, totalPages - 2) }, (_, i) => {
                    let page;
                    if (currentPage <= 4) page = i + 2;
                    else if (currentPage >= totalPages - 3) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;

                    if (page > 1 && page < totalPages) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
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

                  {currentPage < totalPages - 3 && <span style={styles.ellipsis}>...</span>}

                  {totalPages > 1 && (
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      style={{
                        ...styles.pageButton,
                        ...(currentPage === totalPages && styles.activePageButton),
                      }}
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.pageButton,
                      ...(currentPage === totalPages && styles.disabledPageButton),
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Next
                  </button>
                </div>
              )}

              <div style={styles.pageInfo}>
                Page {validCurrentPage} of {totalPages} • Showing {currentCvs.length} of {filteredCvs.length} CV(s)
                {searchQuery && ` for "${searchQuery}"`}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===================== Styles ===================== */
const styles = {
  container: { display: "flex", minHeight: "100vh", backgroundColor: "#A7D5E1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", },
  mainContent: { padding: "2rem", flex: 1, boxSizing: "border-box", overflowY: "auto" },
  heading: { color: "#0078D4", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "20px" },
  searchBox: { display: "flex", alignItems: "center", border: "1px solid #d1dbe8", borderRadius: "4px", padding: "5px 10px", backgroundColor: "#fff" },
  clearInputBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#999", padding: "0 5px", marginLeft: "5px" },
  tableWrapper: { width: "100%", overflowX: "auto", marginTop: "15px", backgroundColor: "#fff", borderRadius: "6px", boxShadow: "0 0 10px rgba(0,0,0,0.05)" },
  table: { width: "100%", minWidth: "1000px", borderCollapse: "collapse", fontFamily: "Segoe UI, sans-serif", fontSize: "14px" },
  pagination: { display: "flex", justifyContent: "center", marginTop: "15px", flexWrap: "wrap" },
  pageButton: { padding: "8px 10px", margin: "3px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", backgroundColor: "#f0f0f0", color: "#333", fontSize: "12px" },
  activePageButton: { backgroundColor: "#0078D4", color: "white", border: "1px solid #0078D4" },
  disabledPageButton: { backgroundColor: "#e0e0e0", color: "#a0a0a0", cursor: "not-allowed" },
  ellipsis: { padding: "8px 5px", margin: "3px" },
  searchInfo: { backgroundColor: "#e8f4ff", padding: "10px 15px", borderRadius: "4px", marginBottom: "15px", border: "1px solid #0078D4", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "500" },
  clearSearchBtn: { backgroundColor: "#ff6b6b", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "500" },
  pageInfo: { textAlign: "center", marginTop: "10px", fontSize: "12px", color: "#666", fontStyle: "italic" },
  loading: { 
    textAlign: "center", 
    padding: "2rem", 
    fontSize: "16px", 
    color: "#0078D4",
    backgroundColor: "#e8f4ff",
    borderRadius: "6px",
    marginBottom: "15px"
  },
  error: { 
    textAlign: "center", 
    padding: "2rem", 
    fontSize: "16px", 
    color: "#ff4d4d",
    backgroundColor: "#ffe8e8",
    borderRadius: "6px",
    marginBottom: "15px"
  },
};

const responsiveStyles = {
  responsiveFlex: { display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-end", marginBottom: "20px" },
  responsiveColumn: { flex: "1 1 200px", minWidth: "200px" },
};

const cellStyle = { border: "1px solid #d1dbe8", padding: "10px", textAlign: "center" };
const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333" };
const inputStyle = { border: "none", outline: "none", padding: "6px", marginLeft: "8px", flex: 1, fontSize: "14px" };
const btnStyle = (bgColor) => ({
  backgroundColor: bgColor, color: "white", padding: "10px 20px", border: "none", borderRadius: "5px",
  cursor: "pointer", textAlign: "center", textDecoration: "none", display: "inline-block", width: "100%", maxWidth: "200px", fontSize: "14px", fontWeight: "500"
});
const actionButton = { color: "white", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "8px", fontSize: "12px" };
const linkStyle = { color: "#0078D4", textDecoration: "none", fontWeight: "bold", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "5px" };

export default CVList;