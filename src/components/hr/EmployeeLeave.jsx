import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebars from './sidebars'; 

const EmployeeLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [nameSearch, setNameSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        axios.get('http://119.148.12.1:8000/api/hrms/api/employee_leaves/')
            .then((response) => {
                setLeaves(response.data);
                setFilteredLeaves(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching leave data:', error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        let results = leaves;

        if (nameSearch) {
            results = results.filter(leave =>
                leave.employee_name.toLowerCase().includes(nameSearch.toLowerCase())
            );
        }

        if (startDate) {
            results = results.filter(leave =>
                new Date(leave.start_date) >= new Date(startDate)
            );
        }

        if (endDate) {
            results = results.filter(leave =>
                new Date(leave.end_date) <= new Date(endDate)
            );
        }

        setFilteredLeaves(results);
    }, [nameSearch, startDate, endDate, leaves]);

    const handleDelete = (id) => {
        axios.delete(`http://119.148.12.1:8000/api/hrms/api/employee_leaves/${id}/`)
            .then(() => {
                setLeaves(leaves.filter(leave => leave.id !== id));
            })
            .catch(error => {
                console.error('Error deleting leave record:', error);
            });
    };

    const handleRowClick = (id) => {
        navigate(`/leave-request-details/${id}`);
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
            <div style={{
                margin: '1px auto',
                marginLeft: '2px',
                maxWidth: '100%',
                backgroundColor: '#A7D5E1',
                border: '1px solid #d1dbe8',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
                flex: 1
            }}>
                <h2 style={{ color: '#0078D4', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                    Employee Leave Records
                </h2>

                {/* Search */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={labelStyle}>Search by Name:</label>
                        <input
                            type="text"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            placeholder="Enter employee name"
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={labelStyle}>Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={labelStyle}>End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setNameSearch('');
                            setStartDate('');
                            setEndDate('');
                        }}
                        style={clearButtonStyle}
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/add-leave-request')} style={btnStyle('#0078D4')}>Add New Leave Record</button>
                    <button onClick={() => navigate('/employee_leave_type')} style={btnStyle('#28a745')}>Employee Leave Type</button>
                    <button onClick={() => navigate('/employee_leave_balance')} style={btnStyle('#6f42c1')}>Employee Leave Balance</button>
                </div>

                {/* Table */}
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '20px',
                    fontFamily: 'Segoe UI, sans-serif',
                    fontSize: '14px',
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e1e9f3' }}>
                            <th style={cellStyle}>Employee</th>
                            <th style={cellStyle}>Leave Type</th>
                            <th style={cellStyle}>Start Date</th>
                            <th style={cellStyle}>End Date</th>
                            <th style={cellStyle}>Reason</th>
                            <th style={cellStyle}>Status</th>
                            <th style={cellStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.length > 0 ? (
                            filteredLeaves.map((leave) => (
                                <tr key={leave.id} style={{ backgroundColor: '#fff', cursor: 'pointer' }} onClick={() => handleRowClick(leave.id)}>
                                    <td style={cellStyle}>{leave.employee_name}</td>
                                    <td style={cellStyle}>{leave.leave_type.replace(/_/g, ' ')}</td>
                                    <td style={cellStyle}>{leave.start_date}</td>
                                    <td style={cellStyle}>{leave.end_date}</td>
                                    <td style={cellStyle}>{leave.reason || 'N/A'}</td>
                                    <td style={cellStyle}>{leave.status}</td>
                                    <td style={cellStyle}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(leave.id); }}
                                            style={{ ...actionButton, backgroundColor: '#ff4d4d' }}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/edit-leave-request/${leave.id}`); }}
                                            style={{ ...actionButton, backgroundColor: '#ffaa00' }}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ ...cellStyle, textAlign: 'center' }}>
                                    No leave records found matching your criteria
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
const styles = {
    container: {
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
};
const cellStyle = {
    border: '1px solid #d1dbe8',
    padding: '10px',
    textAlign: 'center',
    
    
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
};

const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #d1dbe8'
};

const clearButtonStyle = {
    alignSelf: 'flex-end',
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '8px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

const btnStyle = (bgColor) => ({
    backgroundColor: bgColor,
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    minWidth: '180px'
});

const actionButton = {
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
};


export default EmployeeLeave;
