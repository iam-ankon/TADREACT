import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddTermination = () => {
    const [formData, setFormData] = useState({
        employee_id: "",
        name: "",
        designation: "",
        department: "",
        company: "", // The company field
        salary: "",
    });

    const [companies, setCompanies] = useState([]);
    const navigate = useNavigate();

    // Fetch the list of companies from the TAD group
    useEffect(() => {
        axios.get("http://119.148.12.1:8000/api/hrms/api/tad_groups/")  // Replace this URL with your API for TAD group companies
            .then((response) => {
                setCompanies(response.data);
            })
            .catch((error) => {
                console.error("Error fetching companies:", error);
            });
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post("http://119.148.12.1:8000/api/hrms/api/employee_termination/", formData)
            .then(() => {
                alert("Employee added successfully!");
                navigate("/employee-termination");
            })
            .catch((error) => {
                console.error("Error adding employee:", error);
            });
    };

    return (
        <div className="container">
            <div className="card">
                <h2 className="header">Add Employee Termination</h2>
                <form onSubmit={handleSubmit}>
                    {Object.keys(formData).map((key) => (
                        key !== "company" ? (  // Avoid rendering company field as input
                            <div key={key} className="formGroup">
                                <label className="label">{key.replace("_", " ").toUpperCase()}</label>
                                <input
                                    type="text"
                                    name={key}
                                    value={formData[key]}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                />
                            </div>
                        ) : (
                            <div key={key} className="formGroup">
                                <label className="label">Company</label>
                                <select
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.id} - {company.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )
                    ))}
                    <button type="submit" className="submitButton">Submit</button>
                </form>
            </div>
            <style jsx>{`
                .container { 
                    display: flex;
                    flex-direction: column;
                    padding: 40px;
                    background-color: #f4f7fc;
                    align-items: center;
                }
                .card { 
                    background-color: white; 
                    padding: 30px; 
                    border-radius: 8px; 
                    width: 400px; 
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    
                }
                .header { 
                    text-align: center; 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin-bottom: 20px; 
                    color: #333;
                }
                .formGroup { 
                    margin-bottom: 20px;
                }
                .label { 
                    display: block; 
                    font-weight: bold; 
                    color: #333; 
                    margin-bottom: 8px;
                }
                .input { 
                    width: 100%; 
                    padding: 12px; 
                    border: 1px solid #ccc; 
                    border-radius: 4px; 
                    font-size: 16px; 
                    outline: none;
                    box-sizing: border-box;
                    transition: border-color 0.3s;
                    margin-bottom: 12px;
                }
                .input:focus {
                    border-color: #0078D4; /* When input field is focused */
                }
                .submitButton { 
                    background-color: #0078D4; 
                    color: white; 
                    padding: 12px; 
                    width: 100%; 
                    border: none; 
                    border-radius: 4px; 
                    font-size: 16px; 
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .submitButton:hover {
                    background-color: #005a9e; /* Darker shade for button hover */
                }
            `}</style>
        </div>
    );
};

export default AddTermination;
