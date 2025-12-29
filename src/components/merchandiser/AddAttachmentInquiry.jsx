import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";

const AddAttachmentInquiry = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await axios.get(
          "http://119.148.51.38:8000/api/merchandiser/api/inquiry_attachment/"
        );
        console.log(response.data); // Add this line
        setAttachments(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching attachments:", error);
        setLoading(false);
      }
    };
    fetchAttachments();
  }, []);

  // Filter attachments based on search term
  const filteredAttachments = attachments.filter(
    (attachment) =>
      attachment.inquiry?.inquiry_no?.toString().includes(searchTerm) ||
      attachment.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      attachment.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttachments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredAttachments.length / itemsPerPage);

  const handleEdit = (id, currentDescription) => {
    setEditingId(id);
    setEditDescription(currentDescription);
  };

  const handleSave = async (id) => {
    try {
      await axios.patch(
        `http://119.148.51.38:8000/api/merchandiser/api/inquiry_attachment/${id}/`,
        {
          description: editDescription,
        }
      );
      setAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === id
            ? { ...attachment, description: editDescription }
            : attachment
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating description:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this attachment?")) {
      try {
        await axios.delete(
          `http://119.148.51.38:8000/api/merchandiser/api/inquiry_attachment/${id}/`
        );
        setAttachments((prev) =>
          prev.filter((attachment) => attachment.id !== id)
        );
      } catch (error) {
        console.error("Error deleting attachment:", error);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#f7f9fb",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          padding: "2rem",
          marginLeft: "0",
          overflowY: "auto",
          maxHeight: "100vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h1 style={{ color: "#333", fontSize: "28px", fontWeight: "600" }}>
            📎 Inquiry Attachments
          </h1>
          <Link
            to="/inquiries"
            style={{
              background: "linear-gradient(90deg, #4CAF50 0%, #45a049 100%)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              fontWeight: "500",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              textDecoration: "none",
              transition: "0.3s ease",
            }}
          >
            ↩️ Back to Inquiries
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "25px" }}>
          <input
            type="text"
            placeholder="🔍 Search attachments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "12px 15px",
              width: "100%",
              maxWidth: "300px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
              outline: "none",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
          />
        </div>

        {/* Table */}
        <div
          style={{
            overflowX: "auto",
            borderRadius: "10px",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef2f7" }}>
                {[
                  "Inquiry No",
                  "Uploaded At",
                  "Description",
                  "File",
                  "Actions",
                ].map((title, index) => (
                  <th
                    key={index}
                    style={{
                      padding: "14px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#333",
                      borderBottom: "2px solid #ddd",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((attachment) => (
                  <tr
                    key={attachment.id}
                    style={{
                      borderBottom: "1px solid #eee",
                      backgroundColor: "#fff",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px",
                        fontSize: "15px",
                        textAlign: "center",
                      }}
                    >
                      {attachment.inquiry_no?.toString() || "-"}
                    </td>
                    <td
                      style={{
                        padding: "14px",
                        fontSize: "15px",
                        textAlign: "center",
                      }}
                    >
                      {attachment.uploaded_at}
                    </td>
                    <td
                      style={{
                        padding: "14px",
                        fontSize: "15px",
                        textAlign: "center",
                      }}
                    >
                      {editingId === attachment.id ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          style={{
                            padding: "8px",
                            width: "100%",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        attachment.description || "-"
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px",
                        fontSize: "15px",
                        textAlign: "center",
                      }}
                    >
                      <a
                        href={`${attachment.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#1976D2",
                          textDecoration: "none",
                          fontWeight: "500",
                        }}
                      >
                        View File
                      </a>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {editingId === attachment.id ? (
                        <>
                          <button
                            onClick={() => handleSave(attachment.id)}
                            style={{
                              background: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              marginRight: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              background: "#f44336",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleEdit(attachment.id, attachment.description)
                            }
                            style={{
                              background: "#2196F3",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              marginRight: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(attachment.id)}
                            style={{
                              background: "#f44336",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#999",
                    }}
                  >
                    {loading ? "Loading..." : "No attachments found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAttachments.length > itemsPerPage && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                margin: "0 5px",
                border: "1px solid #ddd",
                backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
                color: currentPage === 1 ? "#aaa" : "#333",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                borderRadius: "4px",
              }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  style={{
                    padding: "8px 12px",
                    margin: "0 3px",
                    border: "1px solid #ddd",
                    backgroundColor:
                      currentPage === number ? "#4CAF50" : "#fff",
                    color: currentPage === number ? "#fff" : "#333",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  {number}
                </button>
              )
            )}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                margin: "0 5px",
                border: "1px solid #ddd",
                backgroundColor:
                  currentPage === totalPages ? "#f5f5f5" : "#fff",
                color: currentPage === totalPages ? "#aaa" : "#333",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                borderRadius: "4px",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAttachmentInquiry;
