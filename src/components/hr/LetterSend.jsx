import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLetterSend, deleteLetterSend } from "../../api/employeeApi";
import Sidebars from './sidebars';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileAlt,
  FaEnvelope,
  FaUser,
  FaFilter,
  FaDownload,
  FaEye,
  FaPaperPlane,
} from "react-icons/fa";

const LetterSend = () => {
  const [letters, setLetters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const lettersPerPage = 8;

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        setLoading(true);
        const response = await getLetterSend();
        setLetters(response.data);
      } catch (error) {
        console.error("Error fetching letters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLetters();
  }, []);

  const handleAddLetter = () => {
    navigate("/add-letter");
  };

  const handleEditLetter = (letterId) => {
    navigate(`/edit-letter/${letterId}`);
  };

  const handleDeleteLetter = async (letterId) => {
    if (window.confirm("Are you sure you want to delete this letter?")) {
      try {
        await deleteLetterSend(letterId);
        setLetters(letters.filter((letter) => letter.id !== letterId));
        alert("Letter deleted successfully!");
      } catch (error) {
        console.error("Error deleting letter:", error);
        alert("Failed to delete letter. Please try again.");
      }
    }
  };

  const handleViewLetter = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadLetter = async (fileUrl, fileName) => {
    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || 'letter.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
  };

  // Filter letters based on search and type
  const filteredLetters = letters.filter((letter) => {
    const matchesSearch = letter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         letter.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || letter.letter_type === filterType;
    return matchesSearch && matchesType;
  });

  // Get unique letter types for filter dropdown
  const letterTypes = ["all", ...new Set(letters.map(letter => letter.letter_type).filter(Boolean))];

  // Pagination logic
  const indexOfLastLetter = currentPage * lettersPerPage;
  const indexOfFirstLetter = indexOfLastLetter - lettersPerPage;
  const currentLetters = filteredLetters.slice(indexOfFirstLetter, indexOfLastLetter);
  const totalPages = Math.ceil(filteredLetters.length / lettersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="letter-send-container">
        <Sidebars />
        <div className="content-wrapper">
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading letters...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="letter-send-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="letters-container">
          {/* Header Section */}
          <div className="letters-header">
            <div className="header-content">
              <h1>
                <FaPaperPlane className="header-icon" />
                Letter Management
              </h1>
              <p className="header-subtitle">
                Manage and track all sent letters
              </p>
            </div>
            <button onClick={handleAddLetter} className="btn-add-letter">
              <FaPlus /> Send New Letter
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-dropdown">
              <FaFilter className="filter-icon" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                {letterTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-icon total">
                <FaPaperPlane />
              </div>
              <div className="stat-content">
                <span className="stat-value">{letters.length}</span>
                <span className="stat-label">Total Letters</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card">
                <div className="stat-icon unique">
                  <FaUser />
                </div>
                <div className="stat-content">
                  <span className="stat-value">
                    {new Set(letters.map(l => l.email)).size}
                  </span>
                  <span className="stat-label">Unique Recipients</span>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon types">
                <FaFileAlt />
              </div>
              <div className="stat-content">
                <span className="stat-value">
                  {new Set(letters.map(l => l.letter_type).filter(Boolean)).size}
                </span>
                <span className="stat-label">Letter Types</span>
              </div>
            </div>
          </div>

          {/* Letters Grid */}
          {filteredLetters.length === 0 ? (
            <div className="empty-state">
              <FaEnvelope className="empty-icon" />
              <h3>No Letters Found</h3>
              <p>{searchQuery ? "Try adjusting your search terms" : "No letters have been sent yet"}</p>
              <button onClick={handleAddLetter} className="btn-add-letter">
                <FaPlus /> Send Your First Letter
              </button>
            </div>
          ) : (
            <>
              <div className="letters-grid">
                {currentLetters.map((letter) => (
                  <div key={letter.id} className="letter-card">
                    <div className="card-header">
                      <div className="letter-type-badge">
                        <FaFileAlt />
                        <span>{letter.letter_type || "General"}</span>
                      </div>
                      <div className="card-actions">
                        <button
                          onClick={() => handleEditLetter(letter.id)}
                          className="action-btn edit-btn"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteLetter(letter.id)}
                          className="action-btn delete-btn"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="recipient-info">
                        <div className="avatar">
                          <FaUser />
                        </div>
                        <div className="recipient-details">
                          <h3 className="recipient-name">{letter.name}</h3>
                          <p className="recipient-email">
                            <FaEnvelope /> {letter.email}
                          </p>
                        </div>
                      </div>

                      <div className="letter-details">
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span className="detail-value status sent">Sent</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span className="detail-value">
                            {new Date(letter.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {letter.letter_file && (
                        <div className="letter-file-section">
                          <div className="file-info">
                            <FaFileAlt className="file-icon" />
                            <span className="file-name">
                              Letter Attachment
                            </span>
                          </div>
                          <div className="file-actions">
                            <button
                              onClick={() => handleViewLetter(letter.letter_file)}
                              className="file-btn view-btn"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => handleDownloadLetter(letter.letter_file, `${letter.name}_letter.pdf`)}
                              className="file-btn download-btn"
                            >
                              <FaDownload /> Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn prev"
                  >
                    Previous
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn next"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .letter-send-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .content-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .letters-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          padding: 2rem;
          min-height: 90vh;
        }

        /* Header */
        .letters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .header-content h1 {
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-icon {
          color: #8b5cf6;
          font-size: 1.8rem;
        }

        .header-subtitle {
          color: #64748b;
          margin-top: 0.5rem;
          font-size: 0.95rem;
        }

        .btn-add-letter {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(123, 92, 246, 0.2);
        }

        .btn-add-letter:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(123, 92, 246, 0.3);
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        /* Search and Filter */
        .search-filter-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: center;
        }

        .search-box {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          background: white;
        }

        .filter-dropdown {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .filter-icon {
          color: #8b5cf6;
        }

        .filter-select {
          border: none;
          background: transparent;
          font-size: 0.95rem;
          color: #1e293b;
          cursor: pointer;
          outline: none;
        }

        /* Stats Summary */
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid #e2e8f0;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .stat-icon.total {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          color: #0369a1;
        }

        .stat-icon.unique {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          color: #0ea5e9;
        }

        .stat-icon.types {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          color: #7c3aed;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        /* Letters Grid */
        .letters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .letter-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .letter-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .letter-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
          color: #7c3aed;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: #d1fae5;
          color: #059669;
        }

        .edit-btn:hover {
          background: #a7f3d0;
        }

        .delete-btn {
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fecaca;
        }

        .card-body {
          padding: 1.25rem;
        }

        .recipient-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0369a1;
          font-size: 1.2rem;
        }

        .recipient-details {
          flex: 1;
        }

        .recipient-name {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .recipient-email {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .letter-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }

        .detail-value {
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 600;
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status.sent {
          background: #d1fae5;
          color: #059669;
        }

        .letter-file-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .file-icon {
          color: #8b5cf6;
        }

        .file-name {
          font-weight: 500;
          color: #1e293b;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
        }

        .file-btn {
          flex: 1;
          padding: 0.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .view-btn {
          background: #e0f2fe;
          color: #0369a1;
        }

        .view-btn:hover {
          background: #bae6fd;
        }

        .download-btn {
          background: #ede9fe;
          color: #7c3aed;
        }

        .download-btn:hover {
          background: #ddd6fe;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 2px dashed #cbd5e1;
        }

        .empty-icon {
          font-size: 4rem;
          color: #cbd5e1;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #64748b;
          margin: 0 0 0.5rem 0;
          font-weight: 600;
        }

        .empty-state p {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 0.25rem;
        }

        .page-number {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .page-number:hover {
          background: #f8fafc;
        }

        .page-number.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border-color: #7c3aed;
        }

        /* Loading State */
        .loading-overlay {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          gap: 1rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #e0f2fe;
          border-top: 3px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .letters-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .letters-container {
            padding: 1.5rem;
          }

          .letters-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .search-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .letters-grid {
            grid-template-columns: 1fr;
          }

          .stats-summary {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .pagination {
            flex-direction: column;
            gap: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .header-content h1 {
            font-size: 1.5rem;
          }

          .letter-details {
            grid-template-columns: 1fr;
          }

          .file-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default LetterSend;