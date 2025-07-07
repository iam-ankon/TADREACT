import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebars from './sidebars';

const EmployeeLeaveTypes = () => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get('http://119.148.12.1:8000/api/hrms/api/employee_leave_types/');
            setLeaveTypes(response.data);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    };

    const handleFieldClick = (id, field, value) => {
        setEditingField({ id, field });
        setEditValue(value);
    };

    const handleBlur = async () => {
        if (!editingField) return;

        try {
            const currentLeave = leaveTypes.find((leave) => leave.id === editingField.id);
            const updatedLeave = {
                ...currentLeave,
                [editingField.field]: editValue,
            };

            await axios.put(
                `http://119.148.12.1:8000/api/hrms/api/employee_leave_types/${editingField.id}/`,
                updatedLeave
            );

            setEditingField(null);
            setEditValue('');
            fetchLeaveTypes();
        } catch (error) {
            console.error('Error updating value:', error);
        }
    };

    const renderCell = (leave, field) => {
        if (editingField && editingField.id === leave.id && editingField.field === field) {
            return (
                <input
                    type="number"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    style={editInputStyle}
                />
            );
        }
        return (
            <span
                onClick={() => handleFieldClick(leave.id, field, leave[field])}
                style={cellStyle}
            >
                {leave[field]}
            </span>
        );
    };

    const containerStyle = {
        display: 'flex',
      
        backgroundColor: '#A7D5E1',
        minHeight: '100vh',
    };

    const contentStyle = {
        flex: 1,
        padding: '30px',
    };

    const tableContainerStyle = {
        padding: '20px 30px',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#DCEEF3',
    };

    const headingStyle = {
        fontSize: '20px',
        color: '#0078D4',
        marginBottom: '20px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '10px',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '30px',
        
    };

    const thStyle = {
        textAlign: 'left',
        padding: '10px',
        borderBottom: '2px solid #ddd',
        fontWeight: 'bold',
        color: '#333',
        fontSize: '15px',
    };

    const tdStyle = {
        padding: '10px',
        borderBottom: '1px solid #eee',
        fontSize: '14px',
        color: '#444',
    };

    const cellStyle = {
        cursor: 'pointer',
        padding: '6px 10px',
        display: 'inline-block',
        color: '#333',
    };

    const editInputStyle = {
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        width: '80px',
        fontSize: '14px',
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex' }}>
                <Sidebars />
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {/* Your page content here */}
                </div>
            </div>
            <div style={contentStyle}>
                <div style={tableContainerStyle}>
                    <h2 style={headingStyle}>Employee Leave Types</h2>
                    {leaveTypes.map((leave) => (
                        <table key={leave.id} style={tableStyle}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f3f5' }}>
                                    <th style={thStyle}>Leave Type</th>
                                    <th style={thStyle}>Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={tdStyle}>Public Festival Holiday</td>
                                    <td style={tdStyle}>{renderCell(leave, 'public_festival_holiday')}</td>
                                </tr>
                                <tr>
                                    <td style={tdStyle}>Casual Leave</td>
                                    <td style={tdStyle}>{renderCell(leave, 'casual_leave')}</td>
                                </tr>
                                <tr>
                                    <td style={tdStyle}>Sick Leave</td>
                                    <td style={tdStyle}>{renderCell(leave, 'sick_leave')}</td>
                                </tr>
                                <tr>
                                    <td style={tdStyle}>Earned Leave</td>
                                    <td style={tdStyle}>{renderCell(leave, 'earned_leave')}</td>
                                </tr>
                            </tbody>
                        </table>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeeLeaveTypes;