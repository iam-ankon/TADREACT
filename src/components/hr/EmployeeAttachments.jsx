import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebars from "./sidebars";
import { hrmsApi } from "../../api/employeeApi"; // Import your API wrapper

const EmployeeAttachments = () => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttachments();
  }, [id]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await hrmsApi.get(`employee_attachments/?employee_id=${id}`);
      setAttachments(response.data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      alert("Error fetching attachments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files).map((file) => ({
      file,
      description: "",
    }));
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleTextChange = (index, event) => {
    const updatedFiles = [...files];
    updatedFiles[index].description = event.target.value;
    setFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one file to upload");
      return;
    }

    try {
      setLoading(true);
      
      // Upload files one by one to handle multiple files properly
      for (const fileObj of files) {
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("description", fileObj.description);
        formData.append("employee", id);

        await hrmsApi.post("employee_attachments/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await fetchAttachments();
      alert("Files uploaded successfully!");
      setFiles([]);
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this file?"
    );
    if (!confirmDelete) return;

    try {
      await hrmsApi.delete(`employee_attachments/${attachmentId}/`);
      setAttachments(
        attachments.filter((attachment) => attachment.id !== attachmentId)
      );
      alert("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file. Please try again.");
    }
  };

  const handleEditDescription = async (attachmentId, newDescription) => {
    if (newDescription === null) return; // User cancelled

    try {
      await hrmsApi.patch(`employee_attachments/${attachmentId}/`, {
        description: newDescription,
      });
      await fetchAttachments();
      alert("Description updated successfully!");
    } catch (error) {
      console.error("Error updating description:", error);
      alert("Error updating description. Please try again.");
    }
  };

  const getFileUrl = (filePath) => {
    if (filePath.startsWith("http")) {
      return filePath;
    }
    // Use the backend URL from your API configuration
    return `http://119.148.51.38:8000${filePath}`;
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.content}>
        <div
          style={{
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            padding: "1rem",
          }}
        >
          <div style={styles.card}>
            <h2 style={styles.heading}>Employee Attachments</h2>

            <div style={styles.uploadSection}>
              <div style={styles.fileInputContainer}>
                <label htmlFor="fileInput" style={styles.fileInputLabel}>
                  Choose Files
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    id="fileInput"
                    style={styles.fileInput}
                    disabled={loading}
                  />
                </label>
                <button
                  onClick={handleUpload}
                  style={styles.uploadButton}
                  disabled={files.length === 0 || loading}
                >
                  {loading ? "Uploading..." : `Upload ${files.length > 0 ? `(${files.length})` : ""}`}
                </button>
              </div>

              {files.length > 0 && (
                <div style={styles.selectedFiles}>
                  <h4 style={styles.selectedFilesHeading}>Files to Upload:</h4>
                  {files.map((fileObj, index) => (
                    <div key={index} style={styles.fileItem}>
                      <span style={styles.fileName}>{fileObj.file.name}</span>
                      <input
                        type="text"
                        placeholder="Enter description (optional)"
                        value={fileObj.description}
                        onChange={(event) => handleTextChange(index, event)}
                        style={styles.descriptionInput}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.attachmentsSection}>
              <h3 style={styles.sectionHeading}>Uploaded Files</h3>
              {loading ? (
                <p style={styles.loading}>Loading attachments...</p>
              ) : attachments.length === 0 ? (
                <p style={styles.noFiles}>No files uploaded yet</p>
              ) : (
                <ul style={styles.fileList}>
                  {attachments.map((attachment) => (
                    <li key={attachment.id} style={styles.listItem}>
                      <div style={styles.fileInfo}>
                        <a
                          href={getFileUrl(attachment.file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.fileLink}
                        >
                          {attachment.file.split("/").pop()}
                        </a>
                        <span style={styles.uploadDate}>
                          {new Date(attachment.uploaded_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={styles.descriptionContainer}>
                        <span style={styles.descriptionText}>
                          {attachment.description || "No description"}
                        </span>
                      </div>
                      <div style={styles.actions}>
                        <button
                          onClick={() =>
                            handleEditDescription(
                              attachment.id,
                              prompt(
                                "Enter new description:",
                                attachment.description || ""
                              )
                            )
                          }
                          style={styles.editButton}
                          title="Edit description"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(attachment.id)}
                          style={styles.deleteButton}
                          title="Delete file"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  content: {
    flex: 1,
    padding: "24px",
    overflow: "auto",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    padding: "24px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "24px",
    paddingBottom: "12px",
    borderBottom: "1px solid #eaeaea",
  },
  sectionHeading: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "16px 0",
  },
  uploadSection: {
    marginBottom: "32px",
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
  },
  fileInputContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  fileInputLabel: {
    padding: "10px 16px",
    backgroundColor: "#e9ecef",
    color: "#495057",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  fileInput: {
    display: "none",
  },
  uploadButton: {
    padding: "10px 20px",
    backgroundColor: "#4e73df",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  selectedFiles: {
    marginTop: "16px",
  },
  selectedFilesHeading: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#495057",
    marginBottom: "8px",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
    padding: "8px",
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    border: "1px solid #eaeaea",
  },
  fileName: {
    flex: 1,
    fontSize: "14px",
    color: "#495057",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  descriptionInput: {
    flex: 2,
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    minWidth: "200px",
  },
  attachmentsSection: {
    marginTop: "24px",
  },
  loading: {
    color: "#6c757d",
    textAlign: "center",
    padding: "16px",
  },
  noFiles: {
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    padding: "16px",
  },
  fileList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 0",
    borderBottom: "1px solid #eaeaea",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  fileLink: {
    color: "#4e73df",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
  uploadDate: {
    fontSize: "12px",
    color: "#6c757d",
  },
  descriptionContainer: {
    marginBottom: "8px",
  },
  descriptionText: {
    fontSize: "14px",
    color: "#495057",
    fontStyle: "italic",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  editButton: {
    padding: "6px 12px",
    backgroundColor: "#f6c23e",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
  deleteButton: {
    padding: "6px 12px",
    backgroundColor: "#e74a3b",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
};

// Add hover effects
styles.fileInputLabel[":hover"] = {
  backgroundColor: "#dee2e6",
};

styles.uploadButton[":hover"] = {
  backgroundColor: "#3a5ab5",
};

styles.uploadButton[":disabled"] = {
  backgroundColor: "#cccccc",
  cursor: "not-allowed",
};

styles.editButton[":hover"] = {
  backgroundColor: "#dda20a",
};

styles.deleteButton[":hover"] = {
  backgroundColor: "#be2617",
};

styles.listItem[":last-child"] = {
  borderBottom: "none",
};

styles.fileLink[":hover"] = {
  textDecoration: "underline",
};

export default EmployeeAttachments;