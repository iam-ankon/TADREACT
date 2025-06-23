import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLetterSend, deleteLetterSend } from "../../api/employeeApi";
import Sidebars from './sidebars';

const LetterSend = () => {
  const [cvs, setCvs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const cvsPerPage = 6; // Adjust number of letters per page

  useEffect(() => {
    const fetchCVs = async () => {
      const response = await getLetterSend();
      setCvs(response.data);
    };
    fetchCVs();
  }, []);

  const handleAddCV = () => {
    navigate("/add-letter");
  };

  const handleEditCV = (cvId) => {
    navigate(`/edit-cv/${cvId}`);
  };

  const handleDeleteCV = async (cvId) => {
    if (window.confirm("Are you sure you want to delete this Letter?")) {
      try {
        await deleteLetterSend(cvId);
        setCvs(cvs.filter((cv) => cv.id !== cvId));
        alert("Letter deleted successfully!");
      } catch (error) {
        console.error("Error deleting Letter:", error);
        alert("Failed to delete Letter. Please try again.");
      }
    }
  };

  const filteredCVs = cvs.filter((cv) =>
    cv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastCV = currentPage * cvsPerPage;
  const indexOfFirstCV = indexOfLastCV - cvsPerPage;
  const currentCVs = filteredCVs.slice(indexOfFirstCV, indexOfLastCV);
  const totalPages = Math.ceil(filteredCVs.length / cvsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#DCEEF3",
    },
    mainContent: {
      flex: 1,
      overflowY: "auto",
      padding: "30px",
      backgroundColor: "#A7D5E1",
    },
    heading: {
      fontSize: "26px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#333",
    },
    searchInput: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      width: "30%",
      marginBottom: "20px",
      backgroundColor: "#DCEEF3",
    },
    addButton: {
      padding: "10px 20px",
      backgroundColor: "#0078D4",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginBottom: "20px",
    },
    cardContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "20px",
      
    },
    card: {
      backgroundColor: "#DCEEF3",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      width: '48%', // Adjusted for side-by-side
      display: 'inline-block', // Adjusted for side-by-side
      verticalAlign: 'top', // Align cards to top
      marginRight: '1%', // Add some space between cards
    },
    cardTitle: {
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "10px",
    },
    cardText: {
      color: "#333",
      marginBottom: "8px",
    },
    cardLink: {
      color: "#0078D4",
      textDecoration: "none",
    },
    buttonContainer: {
      marginTop: "10px",
      display: "flex",
      gap: "10px",
    },
    editButton: {
      padding: "6px 12px",
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    deleteButton: {
      padding: "6px 12px",
      backgroundColor: "#d9534f",
      color: "white",
      border: "none",
      borderRadius: "4px",
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

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={styles.mainContent}>
        <h2 style={styles.heading}>Letter Send</h2>

        <input
          type="text"
          placeholder="Search Letter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <button onClick={handleAddCV} style={styles.addButton}>
          Send Email
        </button>

        <div style={styles.cardContainer}>
          {currentCVs.map((cv) => (
            <div key={cv.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{cv.name}</h3>
              <p style={styles.cardText}>Email: {cv.email}</p>
              <p style={styles.cardText}>Letter Type: {cv.letter_type}</p>
              <p style={styles.cardText}>
                Letter File:{" "}
                {cv.letter_file ? (
                  <a
                    href={cv.letter_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.cardLink}
                  >
                    View Letter
                  </a>
                ) : (
                  "No File"
                )}
              </p>
              <div style={styles.buttonContainer}>
                <button
                  onClick={() => handleEditCV(cv.id)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCV(cv.id)}
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

export default LetterSend;