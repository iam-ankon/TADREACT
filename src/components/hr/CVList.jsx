import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from './sidebars';
import { FaEdit, FaTrash, FaFilePdf, FaBarcode, FaSearch } from 'react-icons/fa';

const CVList = () => {
    const [cvs, setCvs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const cvsPerPage = 4;

    useEffect(() => {
        const fetchCVs = async () => {
            try {
                const response = await axios.get("http://119.148.12.1:8000/api/hrms/api/CVAdd/");
                setCvs(response.data);
            } catch (error) {
                console.error("Error fetching CVs:", error);
            }
        };

        fetchCVs();
    }, []);

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this CV?");
        if (confirmDelete) {
            try {
                await axios.delete(`http://119.148.12.1:8000/api/hrms/api/CVAdd/${id}/`);
                setCvs(cvs.filter((cv) => cv.id !== id));
            } catch (error) {
                console.error("Error deleting CV:", error);
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/cv-edit/${id}`);
    };

    const styles = {
        container: {
            display: "flex",
            minHeight: "100vh",
            backgroundColor: "#DCEEF3",
            
        },
        mainContent: {
            flex: 1,
            padding: "20px",
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
        },
        buttonContainer: {
            display: "flex",
            gap: "8px",
        },
        searchInput: {
            padding: "8px",
            marginBottom: "15px",
            width: "250px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
        },
        searchInputField: {
            border: 'none',
            flexGrow: '1',
            padding: '0',
            outline: 'none',
            backgroundColor: "#DCEEF3",
        },
        addButton: {
            padding: "10px 15px",
            backgroundColor: "#006DAA",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
            textDecoration: "none", // Added to remove underline
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "8px",
            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.1)",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "white",
        },
        th: {
            color: "white",
            padding: "10px",
            textAlign: "left",
            fontWeight: "600",
            backgroundColor: "#63B0E3",
        },
        td: {
            padding: "5px",
            cursor: "pointer",
            backgroundColor: '#A7D5E1',
            fontSize: '0.9rem',
            borderBottom: '2px solid #e5e7eb',
        },
        tr: {
            '&:nth-child(even)': {
                backgroundColor: '#f2f2f2',
            },
            '&:hover': {
                backgroundColor: '#e6e6e6',
            }
        },
        actionButton: {
            marginRight: "5px",
            padding: "8px 10px",
            cursor: "pointer",
            border: "none",
            borderRadius: "53px",
            marginBottom: "5px",
        },
        editButton: {
            backgroundColor: "#5bc0de",
            color: "white",
        },
        deleteButton: {
            backgroundColor: "#d9534f",
            color: "white",
        },
        viewCVLink: {
            color: "#0078D4",
            fontWeight: "600",
            fontSize: '0.9rem',
            textDecoration: "none", // Added to remove underline
        },
        barcodeButton: {
            backgroundColor: "#28a745",
            color: "white",
            fontSize: '0.85rem',
            textDecoration: "none", // Added to remove underline
            padding: "8px 10px",
            borderRadius: "53px",
            
            alignItems: "center",
            gap: "3px",
        },
        pagination: {
            display: "flex",
            justifyContent: "center",
            marginTop: "15px",
        },
        pageButton: {
            padding: "8px 10px",
            margin: "3px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
            backgroundColor: "white",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            fontSize: '0.85rem',
        },
        activePageButton: {
            backgroundColor: "#0078D4",
            color: "white",
        },
    };

    const filteredCvs = cvs.filter((cv) =>
        cv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastCv = currentPage * cvsPerPage;
    const indexOfFirstCv = indexOfLastCv - cvsPerPage;
    const currentCvs = filteredCvs.slice(indexOfFirstCv, indexOfLastCv);

    const totalPages = Math.ceil(filteredCvs.length / cvsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
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
                <div style={styles.header}>
                    <h2>All CVs</h2>
                    <div style={styles.buttonContainer}>
                        <Link to="/cv-add" style={styles.addButton}>Add CV</Link>
                    </div>
                </div>
                <div style={styles.searchInput}>
                    <FaSearch />
                    <input
                        type="text"
                        style={styles.searchInputField}
                        placeholder="Search by Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Position For</th>
                            <th style={styles.th}>Age</th>
                            
                            <th style={styles.th}>Phone</th>
                            <th style={styles.th}>Reference</th>
                            <th style={styles.th}>CV File</th>
                            <th style={styles.th}>QRcode</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentCvs.map((cv) => (
                            <tr key={cv.id} style={styles.tr}>
                                <td style={styles.td}>{cv.name}</td>
                                <td style={styles.td}>{cv.position_for}</td>
                                <td style={styles.td}>{cv.age}</td>
                                
                                <td style={styles.td}>{cv.phone}</td>
                                <td style={styles.td}>{cv.reference}</td>
                                <td style={styles.td}>
                                    <a href={cv.cv_file} target="_blank" rel="noopener noreferrer" style={styles.viewCVLink}>
                                        <FaFilePdf /> View CV
                                    </a>
                                </td>
                                <td style={styles.td}>
                                    <Link to={`/cv-detail/${cv.id}`} style={styles.barcodeButton}>
                                        <FaBarcode /> 
                                    </Link>
                                </td>
                                <td style={styles.td}>
                                    <button style={{ ...styles.actionButton, ...styles.editButton }} onClick={() => handleEdit(cv.id)}>
                                        <FaEdit />
                                    </button>
                                    <button style={{ ...styles.actionButton, ...styles.deleteButton }} onClick={() => handleDelete(cv.id)}>
                                        <FaTrash /> 
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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

export default CVList;