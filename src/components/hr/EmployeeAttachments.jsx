import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebars from "./sidebars";
import { hrmsApi } from "../../api/employeeApi";

// Icons (you can use react-icons or any icon library)
import { 
  FiUpload, 
  FiFile, 
  FiTrash2, 
  FiEdit2, 
  FiDownload,
  FiX,
  FiPaperclip,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";

const EmployeeAttachments = () => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchAttachments();
  }, [id]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await hrmsApi.get(`employee_attachments/?employee_id=${id}`);
      
      if (Array.isArray(response.data)) {
        setAttachments(response.data);
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        setAttachments(response.data.results);
      } else if (response.data && typeof response.data === 'object') {
        setAttachments([response.data]);
      } else {
        setAttachments([]);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
      showNotification("error", "Failed to fetch attachments");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files).map((file) => ({
      file,
      description: "",
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const removeSelectedFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const handleTextChange = (index, event) => {
    const updatedFiles = [...files];
    updatedFiles[index].description = event.target.value;
    setFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showNotification("error", "Please select at least one file to upload");
      return;
    }

    try {
      setLoading(true);
      
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("description", fileObj.description);
        formData.append("employee", id);

        setUploadProgress(prev => ({ ...prev, [fileObj.id]: 0 }));

        await hrmsApi.post("employee_attachments/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [fileObj.id]: percentCompleted }));
          },
        });
      }

      await fetchAttachments();
      showNotification("success", `${files.length} file(s) uploaded successfully!`);
      setFiles([]);
      setUploadProgress({});
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Error uploading files:", error);
      showNotification("error", "Error uploading files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId, fileName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );
    if (!confirmDelete) return;

    try {
      await hrmsApi.delete(`employee_attachments/${attachmentId}/`);
      setAttachments(attachments.filter((attachment) => attachment.id !== attachmentId));
      showNotification("success", "File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      showNotification("error", "Error deleting file. Please try again.");
    }
  };

  const handleEditDescription = async (attachmentId, currentDescription) => {
    const newDescription = prompt("Enter new description:", currentDescription || "");
    if (newDescription === null) return;

    try {
      await hrmsApi.patch(`employee_attachments/${attachmentId}/`, {
        description: newDescription,
      });
      await fetchAttachments();
      showNotification("success", "Description updated successfully!");
    } catch (error) {
      console.error("Error updating description:", error);
      showNotification("error", "Error updating description. Please try again.");
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await hrmsApi.get(`employee_attachments/${attachment.id}/download/`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.file.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      showNotification("error", "Error downloading file");
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const iconColor = {
      pdf: '#e74c3c',
      doc: '#3498db',
      docx: '#3498db',
      xls: '#27ae60',
      xlsx: '#27ae60',
      jpg: '#f39c12',
      jpeg: '#f39c12',
      png: '#f39c12',
      txt: '#7f8c8d',
    }[extension] || '#95a5a6';

    return <FiFile style={{ color: iconColor }} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filterAndSortAttachments = () => {
    let filtered = [...attachments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(att => 
        att.file?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
        case 'date_asc':
          return new Date(a.uploaded_at || 0) - new Date(b.uploaded_at || 0);
        case 'name_asc':
          return (a.file || '').localeCompare(b.file || '');
        case 'name_desc':
          return (b.file || '').localeCompare(a.file || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const Notification = () => (
    <div style={{
      ...styles.notification,
      ...(notification.type === 'success' ? styles.notificationSuccess : styles.notificationError),
      ...(notification.show ? styles.notificationShow : {}),
    }}>
      {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
      <span>{notification.message}</span>
    </div>
  );

  const filteredAttachments = filterAndSortAttachments();

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.content}>
        <Notification />
        
        <div style={styles.pageWrapper}>
          <div style={styles.header}>
            <h1 style={styles.title}>Employee Attachments</h1>
            <p style={styles.subtitle}>Manage and organize employee documents</p>
          </div>

          <div style={styles.card}>
            {/* Upload Section */}
            <div style={styles.uploadSection}>
              <div style={styles.uploadHeader}>
                <h3 style={styles.sectionTitle}>
                  <FiUpload style={styles.sectionIcon} />
                  Upload New Files
                </h3>
              </div>

              <div style={styles.uploadArea}>
                <div style={styles.fileInputWrapper}>
                  <label htmlFor="fileInput" style={styles.fileInputLabel}>
                    <FiPaperclip style={styles.fileInputIcon} />
                    <span>Choose Files</span>
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
                    {loading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <FiUpload style={styles.buttonIcon} />
                        Upload {files.length > 0 ? `(${files.length})` : ""}
                      </>
                    )}
                  </button>
                </div>

                {files.length > 0 && (
                  <div style={styles.selectedFiles}>
                    <h4 style={styles.selectedFilesTitle}>Files ready to upload:</h4>
                    {files.map((fileObj, index) => (
                      <div key={fileObj.id} style={styles.selectedFileItem}>
                        <div style={styles.selectedFileInfo}>
                          {getFileIcon(fileObj.file.name)}
                          <span style={styles.selectedFileName}>{fileObj.file.name}</span>
                          <span style={styles.selectedFileSize}>
                            ({formatFileSize(fileObj.file.size)})
                          </span>
                        </div>
                        <div style={styles.selectedFileActions}>
                          <input
                            type="text"
                            placeholder="Add description..."
                            value={fileObj.description}
                            onChange={(event) => handleTextChange(index, event)}
                            style={styles.selectedFileInput}
                            disabled={loading}
                          />
                          {uploadProgress[fileObj.id] !== undefined && (
                            <div style={styles.progressBar}>
                              <div style={{
                                ...styles.progressFill,
                                width: `${uploadProgress[fileObj.id]}%`
                              }} />
                              <span style={styles.progressText}>{uploadProgress[fileObj.id]}%</span>
                            </div>
                          )}
                          <button
                            onClick={() => removeSelectedFile(fileObj.id)}
                            style={styles.removeFileButton}
                            disabled={loading}
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filters and Search */}
            <div style={styles.filtersSection}>
              <div style={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <div style={styles.sortBox}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={styles.sortSelect}
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                </select>
              </div>
            </div>

            {/* Attachments List */}
            <div style={styles.attachmentsSection}>
              <div style={styles.attachmentsHeader}>
                <h3 style={styles.sectionTitle}>
                  <FiPaperclip style={styles.sectionIcon} />
                  Uploaded Files
                </h3>
                <span style={styles.attachmentCount}>
                  {filteredAttachments.length} file(s)
                </span>
              </div>

              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner} />
                  <p style={styles.loadingText}>Loading attachments...</p>
                </div>
              ) : filteredAttachments.length === 0 ? (
                <div style={styles.emptyState}>
                  <FiFile style={styles.emptyIcon} />
                  <h4 style={styles.emptyTitle}>No files found</h4>
                  <p style={styles.emptyText}>
                    {searchTerm ? "Try adjusting your search" : "Upload your first file to get started"}
                  </p>
                </div>
              ) : (
                <div style={styles.fileGrid}>
                  {filteredAttachments.map((attachment) => (
                    <div key={attachment.id} style={styles.fileCard}>
                      <div style={styles.fileCardHeader}>
                        <div style={styles.fileIcon}>
                          {getFileIcon(attachment.file)}
                        </div>
                        <div style={styles.fileActions}>
                          <button
                            onClick={() => handleDownload(attachment)}
                            style={styles.iconButton}
                            title="Download"
                          >
                            <FiDownload />
                          </button>
                          <button
                            onClick={() => handleEditDescription(attachment.id, attachment.description)}
                            style={styles.iconButton}
                            title="Edit description"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(attachment.id, attachment.file?.split('/').pop())}
                            style={{...styles.iconButton, ...styles.deleteButton}}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      <div style={styles.fileCardBody}>
                        <a
                          href={getFileUrl(attachment.file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.fileName}
                          title={attachment.file?.split('/').pop()}
                        >
                          {attachment.file?.split('/').pop()}
                        </a>
                        
                        <div style={styles.description}>
                          {attachment.description || (
                            <span style={styles.noDescription}>No description</span>
                          )}
                        </div>

                        <div style={styles.fileMeta}>
                          <div style={styles.metaItem}>
                            <FiClock style={styles.metaIcon} />
                            <span style={styles.metaText}>
                              {attachment.uploaded_at 
                                ? new Date(attachment.uploaded_at).toLocaleDateString()
                                : "Date unknown"}
                            </span>
                          </div>
                          {attachment.file_size && (
                            <div style={styles.metaItem}>
                              <span style={styles.metaText}>
                                {formatFileSize(attachment.file_size)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  content: {
    flex: 1,
    overflow: "auto",
    position: "relative",
  },
  pageWrapper: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  notification: {
    position: "fixed",
    top: "24px",
    right: "24px",
    padding: "12px 20px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transform: "translateX(400px)",
    transition: "transform 0.3s ease",
    zIndex: 1000,
    backgroundColor: "#ffffff",
  },
  notificationSuccess: {
    borderLeft: "4px solid #10b981",
    color: "#10b981",
  },
  notificationError: {
    borderLeft: "4px solid #ef4444",
    color: "#ef4444",
  },
  notificationShow: {
    transform: "translateX(0)",
  },
  uploadSection: {
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  uploadHeader: {
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  },
  sectionIcon: {
    color: "#3b82f6",
  },
  uploadArea: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    border: "1px dashed #cbd5e1",
  },
  fileInputWrapper: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  fileInputLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    "&:hover": {
      backgroundColor: "#e2e8f0",
    },
  },
  fileInputIcon: {
    fontSize: "18px",
    color: "#64748b",
  },
  fileInput: {
    display: "none",
  },
  uploadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    "&:hover:not(:disabled)": {
      backgroundColor: "#2563eb",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
    "&:disabled": {
      backgroundColor: "#94a3b8",
      cursor: "not-allowed",
      opacity: 0.7,
    },
  },
  buttonIcon: {
    fontSize: "16px",
  },
  selectedFiles: {
    marginTop: "16px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
  selectedFilesTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    marginBottom: "12px",
  },
  selectedFileItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
    border: "1px solid #e2e8f0",
  },
  selectedFileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  selectedFileName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },
  selectedFileSize: {
    fontSize: "12px",
    color: "#64748b",
  },
  selectedFileActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  selectedFileInput: {
    flex: 1,
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    "&:focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
  },
  progressBar: {
    position: "relative",
    width: "100px",
    height: "4px",
    backgroundColor: "#e2e8f0",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
  },
  progressText: {
    position: "absolute",
    right: "0",
    top: "-18px",
    fontSize: "10px",
    color: "#64748b",
  },
  removeFileButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#fee2e2",
    },
  },
  filtersSection: {
    display: "flex",
    gap: "12px",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  searchBox: {
    flex: 1,
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s",
    "&:focus": {
      outline: "none",
      borderColor: "#3b82f6",
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
    "&::placeholder": {
      color: "#94a3b8",
    },
  },
  sortBox: {
    minWidth: "150px",
  },
  sortSelect: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
    "&:focus": {
      outline: "none",
      borderColor: "#3b82f6",
    },
  },
  attachmentsSection: {
    padding: "24px",
  },
  attachmentsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  attachmentCount: {
    fontSize: "14px",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    color: "#64748b",
    fontSize: "14px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px dashed #e2e8f0",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  fileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  fileCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "all 0.2s",
    "&:hover": {
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      transform: "translateY(-2px)",
      borderColor: "#cbd5e1",
    },
  },
  fileCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
  },
  fileIcon: {
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
  },
  fileActions: {
    display: "flex",
    gap: "4px",
  },
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#ffffff",
      color: "#1e293b",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
  },
  deleteButton: {
    "&:hover": {
      color: "#ef4444",
      backgroundColor: "#fee2e2",
    },
  },
  fileCardBody: {
    padding: "16px",
  },
  fileName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    textDecoration: "none",
    marginBottom: "8px",
    wordBreak: "break-all",
    "&:hover": {
      color: "#3b82f6",
      textDecoration: "underline",
    },
  },
  description: {
    fontSize: "13px",
    color: "#475569",
    marginBottom: "12px",
    lineHeight: "1.5",
  },
  noDescription: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  fileMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#64748b",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  metaIcon: {
    fontSize: "12px",
  },
  metaText: {
    color: "#64748b",
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

const getFileUrl = (filePath) => {
  if (!filePath) return "#";
  if (filePath.startsWith("http")) {
    return filePath;
  }
  return `http://119.148.51.38:8000${filePath}`;
};

export default EmployeeAttachments;