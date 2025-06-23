import React, { useState, useEffect } from "react";
import { getFinanceProvisions, addFinanceProvision, updateFinanceProvision, deleteFinanceProvision } from "../../api/employeeApi";
import { useNavigate } from 'react-router-dom';
import Sidebars from './sidebars';
const FinanceProvision = () => {
  const [provisions, setProvisions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProvision, setEditProvision] = useState(null);
  const [newProvision, setNewProvision] = useState({ employee: "", email: "", payroll_pdf: null });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const provisionsPerPage = 6; // Adjust number of provisions per page

  useEffect(() => {
    const fetchProvisions = async () => {
      try {
        const response = await getFinanceProvisions();
        setProvisions(response.data);
      } catch (error) {
        console.error("Error fetching finance provisions:", error);
      }
    };
    fetchProvisions();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteFinanceProvision(id);
      setProvisions(provisions.filter((provision) => provision.id !== id));
    } catch (error) {
      console.error("Error deleting finance provision:", error);
    }
  };

  const handleEdit = (provision) => {
    setEditProvision(provision);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditProvision(null);
  };

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setNewProvision({ employee: "", email: "", payroll_pdf: null });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("employee", editProvision.employee);
    formData.append("email", editProvision.email);
    if (editProvision.payroll_pdf) {
      formData.append("payroll_pdf", editProvision.payroll_pdf);
    }
    try {
      await updateFinanceProvision(editProvision.id, formData);
      setProvisions(provisions.map((item) => (item.id === editProvision.id ? editProvision : item)));
      handleModalClose();
    } catch (error) {
      console.error("Error editing finance provision:", error);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("employee", newProvision.employee);
    formData.append("email", newProvision.email);
    if (newProvision.payroll_pdf) {
      formData.append("payroll_pdf", newProvision.payroll_pdf);
    }
    try {
      const response = await addFinanceProvision(formData);
      setProvisions([...provisions, response.data]);
      handleAddModalClose();
    } catch (error) {
      console.error("Error adding finance provision:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    const updatedValue = type === "file" ? files[0] : value;

    if (editProvision) {
      setEditProvision({ ...editProvision, [name]: updatedValue });
    } else {
      setNewProvision({ ...newProvision, [name]: updatedValue });
    }
  };

  const filteredProvisions = provisions.filter(
    (provision) =>
      provision.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provision.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProvision = currentPage * provisionsPerPage;
  const indexOfFirstProvision = indexOfLastProvision - provisionsPerPage;
  const currentProvisions = filteredProvisions.slice(indexOfFirstProvision, indexOfLastProvision);
  const totalPages = Math.ceil(filteredProvisions.length / provisionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f9fafb",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    mainContent: {
      flex: 1,
      padding: "30px",
      backgroundColor: "#f9fbfc",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    card: {
      border: "1px solid #e0e0e0",
      borderRadius: "10px",
      padding: "20px",
      marginBottom: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      width: '48%',
      display: 'inline-block',
      verticalAlign: 'top',
      marginRight: '1%',
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "10px",
      width: "400px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    },
    input: {
      display: "block",
      width: "100%",
      padding: "10px",
      margin: "10px 0",
      borderRadius: "6px",
      border: "1px solid #ccc",
    },
    button: {
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      marginRight: "10px",
      cursor: "pointer",
    },
    searchBar: {
      padding: "10px",
      marginBottom: "20px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      width: "300px",
    },
    actionButtons: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
    },
    provisionsContainer: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "flex-start",
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
      {/* Sidebar */}
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2>Finance Provision</h2>
          <input
            type="text"
            placeholder="Search by Employee or Email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchBar}
          />
        </div>

        <div style={styles.actionButtons}>
          <button onClick={() => setIsAddModalOpen(true)} style={{ ...styles.button, backgroundColor: "#4CAF50", color: "white" }}>
            Add New Provision
          </button>
          <button onClick={() => navigate('/it-provision')} style={{ ...styles.button, backgroundColor: "#2196F3", color: "white" }}>
            IT Provision
          </button>
          <button onClick={() => navigate('/admin-provision')} style={{ ...styles.button, backgroundColor: "#FF9800", color: "white" }}>
            Admin Provision
          </button>
        </div>

        {/* Provisions List */}
        <div style={styles.provisionsContainer}>
          {currentProvisions.map((provision) => (
            <div key={provision.id} style={styles.card}>
              <h3>{provision.employee}</h3>
              <p>Email: {provision.email}</p>
              {provision.payroll_pdf ? (
                <a href={provision.payroll_pdf} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff" }}>
                  View Payroll PDF
                </a>
              ) : (
                <p>No file uploaded</p>
              )}
              <div style={{ marginTop: "10px" }}>
                <button onClick={() => handleEdit(provision)} style={{ ...styles.button, backgroundColor: "#2196F3", color: "white" }}>Edit</button>
                <button onClick={() => handleDelete(provision.id)} style={{ ...styles.button, backgroundColor: "#f44336", color: "white" }}>Delete</button>
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

        {/* Edit Modal */}
        {isModalOpen && editProvision && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3>Edit Finance Provision</h3>
              <form onSubmit={handleEditSubmit}>
                <input type="text" name="employee" value={editProvision.employee} onChange={handleInputChange} placeholder="Employee Name" style={styles.input} />
                <input type="email" name="email" value={editProvision.email} onChange={handleInputChange} placeholder="Email" style={styles.input} />
                <input type="file" name="payroll_pdf" onChange={handleInputChange} style={styles.input} />
                <button type="submit" style={{ ...styles.button, backgroundColor: "#4CAF50", color: "white" }}>Save</button>
                <button type="button" onClick={handleModalClose} style={{ ...styles.button, backgroundColor: "#ccc" }}>Cancel</button>
              </form>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3>Add New Finance Provision</h3>
              <form onSubmit={handleAddSubmit}>
                <input type="text" name="employee" value={newProvision.employee} onChange={handleInputChange} placeholder="Employee Name" style={styles.input} />
                <input type="email" name="email" value={newProvision.email} onChange={handleInputChange} placeholder="Email" style={styles.input} />
                <input type="file" name="payroll_pdf" onChange={handleInputChange} style={styles.input} />
                <button type="submit" style={{ ...styles.button, backgroundColor: "#4CAF50", color: "white" }}>Add</button>
                <button type="button" onClick={handleAddModalClose} style={{ ...styles.button, backgroundColor: "#ccc" }}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceProvision;