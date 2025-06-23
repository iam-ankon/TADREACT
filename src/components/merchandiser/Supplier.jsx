
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../merchandiser/Sidebar.jsx";

const Supplier = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSuppliers = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://119.148.12.1:8000/api/merchandiser/api/supplier/');
                setSuppliers(response.data);
            } catch (error) {
                toast.error('Failed to fetch suppliers');
            } finally {
                setLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await axios.delete(`http://119.148.12.1:8000/api/merchandiser/api/supplier/${id}/`);
                setSuppliers(suppliers.filter(supplier => supplier.id !== id));
                toast.success('Supplier deleted successfully');
            } catch (error) {
                toast.error('Failed to delete supplier');
            }
        }
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.vendor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh'}}>
            <Sidebar />

            <div style={{ flexGrow: 1, padding: '2rem', backgroundColor: '#f3f4f6' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Supplier Management</h1>

                {/* Search + Add */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flexGrow: 1,
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    />
                    <button
                        onClick={() => navigate('/add-supplier')}
                        style={{
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1.2rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        + Add Supplier
                    </button>
                </div>

                {/* Table */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    overflowX: 'auto',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9fafb' }}>
                            <tr>
                                {['Vendor ID', 'Name', 'Type', 'Email', 'Status', 'Actions'].map((head) => (
                                    <th key={head} style={{
                                        textAlign: 'left',
                                        padding: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        borderBottom: '1px solid #e5e7eb'
                                    }}>
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No suppliers found</td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier, idx) => (
                                    <tr key={supplier.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                        <td style={{ padding: '1rem', color: '#374151' }}>{supplier.vendor_id}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500', color: '#111827' }} onClick={() => navigate(`/suppliers/${supplier.id}`)}>{supplier.name}</td>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>{supplier.vendor_type}</td>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>{supplier.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                backgroundColor:
                                                    supplier.agreement_status === 'active' ? '#d1fae5' :
                                                        supplier.agreement_status === 'pending' ? '#fef3c7' :
                                                            '#fee2e2',
                                                color:
                                                    supplier.agreement_status === 'active' ? '#065f46' :
                                                        supplier.agreement_status === 'pending' ? '#92400e' :
                                                            '#b91c1c'
                                            }}>
                                                {supplier.agreement_status || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => navigate(`/edit/suppliers/${supplier.id}`)}
                                                style={{
                                                    marginRight: '0.5rem',
                                                    color: '#2563eb',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                style={{
                                                    color: '#dc2626',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Supplier;
