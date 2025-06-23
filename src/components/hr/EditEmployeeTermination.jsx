import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://119.148.12.1:8000/api/hrms/api/employee_termination/";
const COMPANY_API_URL = "http://119.148.12.1:8000/api/hrms/api/tad_groups/";

const EditEmployeeTermination = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: "",
        name: "",
        designation: "",
        department: "",
        company: "",
        salary: "",
    });

    useEffect(() => {
        fetchEmployeeDetails();
        fetchCompanies();
    }, []);

    const fetchEmployeeDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}${id}/`);
            setFormData(response.data);
        } catch (error) {
            console.error("Error fetching employee details:", error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(COMPANY_API_URL);
            setCompanies(response.data);
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}${id}/`, formData);
            navigate("/employee-termination");
        } catch (error) {
            console.error("Error updating employee:", error);
        }
    };

    return (
        <div className="container">
            

            <div className="main-content">
                <h2>Edit Employee Termination</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" name="employee_id" placeholder="Employee ID" value={formData.employee_id} onChange={handleChange} required />
                    <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                    <input type="text" name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} required />
                    <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} required />
                    <select name="company" value={formData.company} onChange={handleChange} required>
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                            <option key={company.id} value={company.id}>{company.company_name}</option>
                        ))}
                    </select>
                    <input type="number" name="salary" placeholder="Salary" value={formData.salary} onChange={handleChange} required />
                    <button type="submit" className="submit-btn">Update Employee</button>
                </form>
                <button className="cancel-btn" onClick={() => navigate("/employee-termination")}>Cancel</button>
            </div>

            <style jsx>{`
                .container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f4f7fc;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
              
                .sidebar h2 {
                    margin-bottom: 20px;
                    font-size: 24px;
                }
                .sidebar ul {
                    list-style: none;
                    padding: 0;
                    font-size: 18px;
                }
                .sidebar ul li {
                    margin: 10px 0;
                }
                .main-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    width: 500px;
                    box-sizing: border-box;
                }
                .main-content h2 {
                    font-size: 28px;
                    margin-bottom: 20px;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                input, select {
                    padding: 10px;
                    font-size: 16px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 12px;
                }
                select {
                    cursor: pointer;
                }
                .submit-btn {
                    padding: 12px;
                    font-size: 16px;
                    background-color: #0078D4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .submit-btn:hover {
                    background-color: #005a9e;
                }
                .cancel-btn {
                    padding: 10px 20px;
                    font-size: 16px;
                    background-color: #d9534f;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin-top: 15px;
                }
                .cancel-btn:hover {
                    background-color: #c12f2b;
                }
            `}</style>
        </div>
    );
};

export default EditEmployeeTermination;
