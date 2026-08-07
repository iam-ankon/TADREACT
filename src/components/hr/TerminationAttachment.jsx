import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { 
  hrmsApi, 
  getCsrfToken 
} from "../../api/employeeApi";

const TerminationAttachment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchAttachments();
    }
  }, [id]);

  const fetchAttachments = async () => {
    if (!id) {
      setError("No employee ID provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching attachments for employee ID: ${id}`);
      
      // Try multiple possible endpoints
      let response;
      
      // Try employee_termination endpoint first
      try {
        console.log("Trying employee_termination endpoint...");
        response = await hrmsApi.get(`employee_termination/?employee=${id}`);
        
        if (response.data && response.data.length > 0) {
          console.log("Found termination records:", response.data.length);
          // Check if attachments are included in termination data
          const terminationData = response.data[0];
          if (terminationData.attachments) {
            setAttachments(terminationData.attachments);
            return;
          }
        }
      } catch (terminationError) {
        console.log("employee_termination endpoint failed, trying other options...");
      }
      
      // Try checking if employee has any documents in their record
      try {
        console.log("Trying employee documents endpoint...");
        response = await hrmsApi.get(`employees/${id}/`);
        
        if (response.data) {
          const employeeData = response.data;
          
          // Check for attachments in employee data
          if (employeeData.documents || employeeData.attachments) {
            setAttachments(employeeData.documents || employeeData.attachments || []);
            return;
          }
          
          // If no attachments found, show appropriate message
          setAttachments([]);
          console.log("No attachments found for this employee");
          return;
        }
      } catch (employeeError) {
        console.error("Error fetching employee data:", employeeError);
      }
      
      // If we get here, no attachments were found
      setAttachments([]);
      console.log("No attachments found for employee");
      
    } catch (error) {
      console.error("Error fetching attachments:", error);
      
      // Check if it's a 404 error and handle gracefully
      if (error.response?.status === 404) {
        setError(`The attachments endpoint was not found. Please ensure the backend has the 'termination_attachment' endpoint implemented.`);
        setAttachments([]); // Set empty array instead of showing error
      } else {
        setError("Failed to load attachments. Please try again later.");
      }
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

    setUploading(true);
    setError(null);

    try {
      // First, check if we have a termination record for this employee
      let terminationId = null;
      
      try {
        const terminationResponse = await hrmsApi.get(`employee_termination/?employee=${id}`);
        if (terminationResponse.data && terminationResponse.data.length > 0) {
          terminationId = terminationResponse.data[0].id;
        }
      } catch (err) {
        console.log("No existing termination record found");
      }
      
      // If no termination record exists, create one first
      if (!terminationId) {
        try {
          // Create a basic termination record
          const createResponse = await hrmsApi.post("employee_termination/", {
            employee: id,
            termination_date: new Date().toISOString().split('T')[0],
            termination_reason: "Document upload",
            status: "pending"
          });
          
          if (createResponse.data && createResponse.data.id) {
            terminationId = createResponse.data.id;
            console.log("Created termination record with ID:", terminationId);
          }
        } catch (createError) {
          console.error("Failed to create termination record:", createError);
          throw new Error("Please create a termination record first before uploading documents.");
        }
      }
      
      // Now upload the files
      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append("files", fileObj.file);
        formData.append("descriptions", fileObj.description);
      });
      
      // Add employee and termination info
      formData.append("employee", id);
      if (terminationId) {
        formData.append("termination", terminationId);
      }
      
      // Try uploading to employee endpoint if termination_attachment doesn't exist
      let uploadResponse;
      try {
        console.log("Attempting to upload files...");
        uploadResponse = await hrmsApi.post(`employees/${id}/upload_documents/`, formData, {
          headers: { 
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": getCsrfToken()
          },
        });
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        
        // If that endpoint doesn't exist, show error
        if (uploadError.response?.status === 404) {
          throw new Error("File upload endpoint not available. Please contact administrator.");
        } else {
          throw uploadError;
        }
      }
      
      // Refresh attachments
      await fetchAttachments();
      alert("Files uploaded successfully!");
      setFiles([]);
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Error uploading files:", error);
      setError(`Upload failed: ${error.message || "Please try again."}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this file?"
    );
    if (!confirmDelete) return;

    try {
      // Try to delete from employee documents endpoint
      await hrmsApi.delete(`employees/${id}/delete_document/${attachmentId}/`);
      
      // Refresh attachments
      await fetchAttachments();
      alert("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file. Please try again.");
    }
  };

  const handleEditDescription = async (attachmentId, newDescription) => {
    if (newDescription === null) return; // User cancelled

    try {
      await hrmsApi.patch(
        `employees/${id}/update_document/${attachmentId}/`,
        { description: newDescription }
      );
      await fetchAttachments();
      alert("Description updated successfully!");
    } catch (error) {
      console.error("Error updating description:", error);
      alert("Error updating description. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.header}>
            <button 
              onClick={() => navigate(-1)}
              style={styles.backButton}
            >
              ← Back
            </button>
            <h2 style={styles.heading}>Employee Documents</h2>
          </div>
          
          <div style={styles.employeeInfo}>
            <p>Employee ID: {id}</p>
            <p style={styles.infoNote}>
              This page allows you to upload and manage documents for this employee.
              {error && <span style={{color: '#dc3545', marginLeft: '10px'}}>{error}</span>}
            </p>
          </div>

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
                />
              </label>
              <button
                onClick={handleUpload}
                style={{
                  ...styles.uploadButton,
                  ...(uploading ? styles.disabledButton : {})
                }}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? "Uploading..." : `Upload ${files.length > 0 ? `(${files.length})` : ""}`}
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
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.attachmentsSection}>
            <h3 style={styles.sectionHeading}>Uploaded Documents</h3>
            {loading ? (
              <p style={styles.loadingText}>Loading documents...</p>
            ) : attachments.length === 0 ? (
              <div style={styles.noFilesContainer}>
                <p style={styles.noFiles}>No documents uploaded yet</p>
                <p style={styles.noFilesSubtitle}>
                  Use the upload button above to add documents for this employee.
                </p>
              </div>
            ) : (
              <ul style={styles.fileList}>
                {attachments.map((attachment) => (
                  <li key={attachment.id} style={styles.listItem}>
                    <div style={styles.fileInfo}>
                      <a
                        href={
                          attachment.file?.startsWith("http")
                            ? attachment.file
                            : attachment.file?.startsWith("/")
                            ? `http://119.148.51.38:8000${attachment.file}`
                            : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.fileLink}
                        onClick={(e) => {
                          if (!attachment.file || attachment.file === "#") {
                            e.preventDefault();
                            alert("File link not available");
                          }
                        }}
                      >
                        {attachment.file?.split("/").pop() || `Document ${attachment.id}`}
                      </a>
                      <span style={styles.uploadDate}>
                        {attachment.uploaded_at 
                          ? new Date(attachment.uploaded_at).toLocaleString()
                          : "Date not available"}
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
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(attachment.id)}
                        style={styles.deleteButton}
                        title="Delete file"
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
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  backButton: {
    padding: "8px 16px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: 0,
  },
  employeeInfo: {
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#495057",
  },
  infoNote: {
    fontSize: "12px",
    color: "#6c757d",
    marginTop: "8px",
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
  disabledButton: {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
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
  loadingText: {
    color: "#6c757d",
    textAlign: "center",
    padding: "16px",
  },
  noFilesContainer: {
    textAlign: "center",
    padding: "32px",
  },
  noFiles: {
    color: "#6c757d",
    fontSize: "16px",
    marginBottom: "8px",
  },
  noFilesSubtitle: {
    color: "#adb5bd",
    fontSize: "14px",
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
    transition: "background-color 0.2s",
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
    transition: "background-color 0.2s",
  },
};

// Add hover effects
Object.assign(styles.fileInputLabel, {
  ':hover': {
    backgroundColor: "#dee2e6",
  },
});

Object.assign(styles.uploadButton, {
  ':hover': {
    backgroundColor: "#3a5ab5",
  },
  ':disabled': {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
  },
});

Object.assign(styles.editButton, {
  ':hover': {
    backgroundColor: "#dda20a",
  },
});

Object.assign(styles.deleteButton, {
  ':hover': {
    backgroundColor: "#be2617",
  },
});

Object.assign(styles.fileLink, {
  ':hover': {
    textDecoration: "underline",
  },
});

Object.assign(styles.backButton, {
  ':hover': {
    backgroundColor: "#5a6268",
  },
});

Object.assign(styles.listItem, {
  ':last-child': {
    borderBottom: "none",
  },
});

export default TerminationAttachment;