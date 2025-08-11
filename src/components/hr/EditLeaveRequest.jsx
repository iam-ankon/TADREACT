import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Sidebars from './sidebars';

const EditLeaveRequest = () => {
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        employee: '',
        employee_code: '',
        designation: '',
        joining_date: '',
        department: '',
        company: '',
        personal_phone: '',
        sub_person: '',
        from_email: '',
        to: '',
        to_email: '',
        cc: '',
        date: '',
        start_date: '',
        end_date: '',
        leave_days: '',
        balance: '',
        whereabouts: '',
        teamleader: '',
        comment: '',
        hrcomment: '',
        leave_type: '',
        date_of_joining_after_leave: '',
        actual_date_of_joining: '',
        reason_for_delay: '',
        status: '',
        emergency_contact: "",
    });

    useEffect(() => {
        axios.get(`http://119.148.12.1:8000/api/hrms/api/employee_leaves/${id}/`)
            .then(res => setFormData(res.data))
            .catch(err => console.error(err));
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        setLoading(true);
        axios.put(`http://119.148.12.1:8000/api/hrms/api/employee_leaves/${id}/`, formData)
            .then(() => {
                navigate('/employee_leave');
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const containerStyle = {
        display: 'flex',
        backgroundColor: "#DCEEF3",
        minHeight: '100vh',
    };

    const mainContentStyle = {
        flex: 1,
        padding: '30px',
        backgroundColor: '#A7D5E1',
    };

    const formContainerStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        maxWidth: '1000px',
        margin: '0 auto',
    };

    const sectionContainerStyle = {
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        backgroundColor: "#DCEEF3",
    };

    const sectionHeaderStyle = {
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#555',
    };

    const formGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
    };

    const formGroupStyle = {
        display: 'flex',
        flexDirection: 'column',
    };

    const formLabelStyle = {
        fontWeight: '600',
        marginBottom: '5px',
    };

    const formInputStyle = {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    };

    const formSelectStyle = {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    };

    const formTextAreaStyle = {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        minHeight: '100px',
    };

    const submitButtonStyle = {
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '20px',
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex' }}>
                <Sidebars />

            </div>

            <div style={mainContentStyle}>

                <div style={formContainerStyle}>
                    <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Edit Leave Request</h2>

                    <div style={sectionContainerStyle}>
                        <h3 style={sectionHeaderStyle}>Employee Information (Read-only)</h3>
                        <div style={formGridStyle}>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Employee</label>
                                <input type="text" name="employee" value={formData.employee_name || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Employee ID</label>
                                <input type="text" name="employee_code" value={formData.employee_code ?? ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Designation</label>
                                <input type="text" name="designation" value={formData.designation || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Email</label>
                                <input type="email" name="email" value={formData.email || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>To</label>
                                <input type="text" name="to" value={formData.to || ''} onChange={handleChange} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Joining Date</label>
                                <input type="date" name="joining_date" value={formData.joining_date || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Department</label>
                                <input type="text" name="department" value={formData.department_name || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Company</label>
                                <input type="text" name="company" value={formData.company_name || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Personal Phone</label>
                                <input type="text" name="personal_phone" value={formData.personal_phone || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Substitute Person</label>
                                <input type="text" name="sub_person" value={formData.sub_person || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Date</label>
                                <input type="date" name="date" value={formData.date || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Start Date</label>
                                <input type="date" name="start_date" value={formData.start_date || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>End Date</label>
                                <input type="date" name="end_date" value={formData.end_date || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Leave Days</label>
                                <input type="number" name="leave_days" value={formData.leave_days || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Balance</label>
                                <input type="number" name="balance" value={formData.balance || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Date of Joining After Leave</label>
                                <input type="date" name="date_of_joining_after_leave" value={formData.date_of_joining_after_leave || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Actual Date of Joining</label>
                                <input type="date" name="actual_date_of_joining" value={formData.actual_date_of_joining || ''} style={formInputStyle} readOnly disabled />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Reason for Delay</label>
                                <textarea name="reason_for_delay" value={formData.reason_for_delay || ''} style={formTextAreaStyle} readOnly disabled></textarea>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Where abouts</label>
                                <textarea name="whereabouts" value={formData.whereabouts || ''} style={formTextAreaStyle} readOnly disabled></textarea>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Leave Type</label>
                                <select name="leave_type" value={formData.leave_type || ''} style={formSelectStyle} readOnly disabled>
                                    <option value="public_festival_holiday">Public Festival Holiday</option>
                                    <option value="casual_leave">Casual Leave</option>
                                    <option value="sick_leave">Sick Leave</option>
                                    <option value="earned_leave">Earned Leave</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={sectionContainerStyle}>
                        <h3 style={sectionHeaderStyle}>Editable Fields (Only by Authority)</h3>
                        <div style={formGridStyle}>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>From Email</label>
                                <input type="email" name="from_email" value={formData.from_email || ''} onChange={handleChange} style={formInputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>To Email</label>
                                <input type="email" name="to_email" value={formData.to_email || ''} onChange={handleChange} style={formInputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>CC</label>
                                <input type="email" name="cc" value={formData.cc || ''} onChange={handleChange} style={formInputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>MD Sir Comment</label>
                                <textarea name="comment" value={formData.comment || ''} onChange={handleChange} style={formTextAreaStyle}></textarea>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Team Leader</label>
                                <textarea type="text" name="teamleader" value={formData.teamleader || ''} onChange={handleChange} style={formInputStyle} ></textarea>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>HR Comment</label>
                                <textarea name="hrcomment" value={formData.hrcomment || ''} onChange={handleChange} style={formTextAreaStyle}></textarea>
                            </div>
                            <div style={formGroupStyle}>
                                <label style={formLabelStyle}>Only MD Sir Approval</label>
                                <select name="status" value={formData.status || ''} onChange={handleChange} style={formSelectStyle}>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button type="button" onClick={handleSubmit} style={submitButtonStyle} disabled={loading}>
                            {loading ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default EditLeaveRequest;

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import Sidebars from "./sidebars";

// const EditLeaveRequest = () => {
//   const [loading, setLoading] = useState(false);
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [departments, setDepartments] = useState([]);
//   const [formData, setFormData] = useState({
//     employee: "",
//     employee_code: "",
//     designation: "",
//     joining_date: "",
//     department: "",
//     company: "",
//     personal_phone: "",
//     sub_person: "",
//     from_email: "",
//     to: "",
//     to_email: "",
//     cc: "",
//     date: "",
//     start_date: "",
//     end_date: "",
//     leave_days: "",
//     balance: "",
//     whereabouts: "",
//     teamleader: "",
//     comment: "",
//     hrcomment: "",
//     leave_type: "",
//     date_of_joining_after_leave: "",
//     actual_date_of_joining: "",
//     reason_for_delay: "",
//     status: "",
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get(
//           `http://119.148.12.1:8000/api/hrms/api/employee_leaves/${id}/`
//         );
//         const data = response.data;
//         const deptResponse = await axios.get(
//           "http://119.148.12.1:8000/api/hrms/api/departments/"
//         );
//         setDepartments(deptResponse.data);

//         // Find department name
//         const departmentObj = deptResponse.data.find(
//           (dept) => dept.id.toString() === data.department?.toString()
//         );
//         const departmentName = departmentObj?.department_name || "";

//         console.log("Full API Response:", data); // Debugging

//         // Handle nested employee data if it exists
//         const employeeData = data.employee || {};

//         setFormData({
//           ...data,
//           // Employee information
//           employee:
//             employeeData.name || data.employee_name || data.employee || "",
//           employee_code: employeeData.employee_id || data.employee_code || "",
//           designation: employeeData.designation || data.designation || "",
//           joining_date: employeeData.joining_date || data.joining_date || "",
//           // Department information - handle both direct and nested
//           department: departmentName || data.department || "",
//           // Company information
//           company:
//             employeeData.company?.name ||
//             data.company?.name ||
//             data.company_name ||
//             data.company ||
//             "",
//           // Contact information
//           personal_phone:
//             employeeData.personal_phone || data.personal_phone || "",

//           // Format dates
//           date: data.date ? data.date.split("T")[0] : "",
//           start_date: data.start_date ? data.start_date.split("T")[0] : "",
//           end_date: data.end_date ? data.end_date.split("T")[0] : "",
//           date_of_joining_after_leave: data.date_of_joining_after_leave
//             ? data.date_of_joining_after_leave.split("T")[0]
//             : "",
//           actual_date_of_joining: data.actual_date_of_joining
//             ? data.actual_date_of_joining.split("T")[0]
//             : "",
//         });
//       } catch (err) {
//         console.error("Error fetching leave request:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [id]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = () => {
//     setLoading(true);
//     axios
//       .put(
//         `http://119.148.12.1:8000/api/hrms/api/employee_leaves/${id}/`,
//         formData
//       )
//       .then(() => {
//         navigate("/employee_leave");
//       })
//       .catch((err) => console.error(err))
//       .finally(() => setLoading(false));
//   };

//   const containerStyle = {
//     display: "flex",
//     backgroundColor: "#DCEEF3",
//     minHeight: "100vh",
//   };

//   const mainContentStyle = {
//     flex: 1,
//     padding: "30px",
//     backgroundColor: "#A7D5E1",
//   };

//   const formContainerStyle = {
//     backgroundColor: "#fff",
//     padding: "20px",
//     borderRadius: "8px",
//     boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//     maxWidth: "1000px",
//     margin: "0 auto",
//   };

//   const sectionContainerStyle = {
//     marginBottom: "20px",
//     padding: "15px",
//     border: "1px solid #e0e0e0",
//     borderRadius: "6px",
//     backgroundColor: "#DCEEF3",
//   };

//   const sectionHeaderStyle = {
//     fontWeight: "bold",
//     marginBottom: "10px",
//     color: "#555",
//   };

//   const formGridStyle = {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//     gap: "15px",
//   };

//   const formGroupStyle = {
//     display: "flex",
//     flexDirection: "column",
//   };

//   const formLabelStyle = {
//     fontWeight: "600",
//     marginBottom: "5px",
//   };

//   const formInputStyle = {
//     padding: "8px",
//     borderRadius: "4px",
//     border: "1px solid #ccc",
//   };

//   const formSelectStyle = {
//     padding: "8px",
//     borderRadius: "4px",
//     border: "1px solid #ccc",
//   };

//   const formTextAreaStyle = {
//     padding: "8px",
//     borderRadius: "4px",
//     border: "1px solid #ccc",
//     minHeight: "100px",
//   };

//   const submitButtonStyle = {
//     padding: "10px 20px",
//     backgroundColor: "#4CAF50",
//     color: "white",
//     border: "none",
//     borderRadius: "4px",
//     cursor: "pointer",
//     marginTop: "20px",
//   };

//   return (
//     <div style={containerStyle}>
//       <div style={{ display: "flex" }}>
//         <Sidebars />
//       </div>

//       <div style={mainContentStyle}>
//         <div style={formContainerStyle}>
//           <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
//             <h2
//               style={{
//                 textAlign: "center",
//                 marginBottom: "20px",
//                 color: "#333",
//               }}
//             >
//               Edit Leave Request
//             </h2>

//             <div style={sectionContainerStyle}>
//               <h3 style={sectionHeaderStyle}>
//                 Employee Information (Read-only)
//               </h3>
//               <div style={formGridStyle}>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Employee</label>
//                   <input
//                     type="text"
//                     name="employee"
//                     value={formData.employee || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Employee ID</label>
//                   <input
//                     type="text"
//                     name="employee_code"
//                     value={formData.employee_code || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Designation</label>
//                   <input
//                     type="text"
//                     name="designation"
//                     value={formData.designation || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Email</label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>To</label>
//                   <input
//                     type="text"
//                     name="to"
//                     value={formData.to || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Joining Date</label>
//                   <input
//                     type="date"
//                     name="joining_date"
//                     value={formData.joining_date || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Department</label>
//                   <input
//                     type="text"
//                     name="department"
//                     value={formData.department || "Not available"}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Company</label>
//                   <input
//                     type="text"
//                     name="company"
//                     value={formData.company || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Personal Phone</label>
//                   <input
//                     type="text"
//                     name="personal_phone"
//                     value={formData.personal_phone || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>

//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Substitute Person</label>
//                   <input
//                     type="text"
//                     name="sub_person"
//                     value={formData.sub_person || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Date</label>
//                   <input
//                     type="date"
//                     name="date"
//                     value={formData.date || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Start Date</label>
//                   <input
//                     type="date"
//                     name="start_date"
//                     value={formData.start_date || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>End Date</label>
//                   <input
//                     type="date"
//                     name="end_date"
//                     value={formData.end_date || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Leave Days</label>
//                   <input
//                     type="number"
//                     name="leave_days"
//                     value={formData.leave_days || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Balance</label>
//                   <input
//                     type="number"
//                     name="balance"
//                     value={formData.balance || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>
//                     Date of Joining After Leave
//                   </label>
//                   <input
//                     type="date"
//                     name="date_of_joining_after_leave"
//                     value={formData.date_of_joining_after_leave || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Actual Date of Joining</label>
//                   <input
//                     type="date"
//                     name="actual_date_of_joining"
//                     value={formData.actual_date_of_joining || ""}
//                     style={formInputStyle}
//                     readOnly
//                     disabled
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Reason for Delay</label>
//                   <textarea
//                     name="reason_for_delay"
//                     value={formData.reason_for_delay || ""}
//                     style={formTextAreaStyle}
//                     readOnly
//                     disabled
//                   ></textarea>
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Where abouts</label>
//                   <textarea
//                     name="whereabouts"
//                     value={formData.whereabouts || ""}
//                     style={formTextAreaStyle}
//                     readOnly
//                     disabled
//                   ></textarea>
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Leave Type</label>
//                   <select
//                     name="leave_type"
//                     value={formData.leave_type || ""}
//                     style={formSelectStyle}
//                     readOnly
//                     disabled
//                   >
//                     <option value="">Select Leave Type</option>
//                     <option value="public_festival_holiday">
//                       Public Festival Holiday
//                     </option>
//                     <option value="casual_leave">Casual Leave</option>
//                     <option value="sick_leave">Sick Leave</option>
//                     <option value="earned_leave">Earned Leave</option>
//                   </select>
//                 </div>
//               </div>
//             </div>

//             <div style={sectionContainerStyle}>
//               <h3 style={sectionHeaderStyle}>
//                 Editable Fields (Only by Authority)
//               </h3>
//               <div style={formGridStyle}>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>From Email</label>
//                   <input
//                     type="email"
//                     name="from_email"
//                     value={formData.from_email || ""}
//                     onChange={handleChange}
//                     style={formInputStyle}
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>To Email</label>
//                   <input
//                     type="email"
//                     name="to_email"
//                     value={formData.to_email || ""}
//                     onChange={handleChange}
//                     style={formInputStyle}
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>CC</label>
//                   <input
//                     type="email"
//                     name="cc"
//                     value={formData.cc || ""}
//                     onChange={handleChange}
//                     style={formInputStyle}
//                   />
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>MD Sir Comment</label>
//                   <textarea
//                     name="comment"
//                     value={formData.comment || ""}
//                     onChange={handleChange}
//                     style={formTextAreaStyle}
//                   ></textarea>
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Team Leader</label>
//                   <textarea
//                     type="text"
//                     name="teamleader"
//                     value={formData.teamleader || ""}
//                     onChange={handleChange}
//                     style={formInputStyle}
//                   ></textarea>
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>HR Comment</label>
//                   <textarea
//                     name="hrcomment"
//                     value={formData.hrcomment || ""}
//                     onChange={handleChange}
//                     style={formTextAreaStyle}
//                   ></textarea>
//                 </div>
//                 <div style={formGroupStyle}>
//                   <label style={formLabelStyle}>Only MD Sir Approval</label>
//                   <select
//                     name="status"
//                     value={formData.status || ""}
//                     onChange={handleChange}
//                     style={formSelectStyle}
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="approved">Approved</option>
//                     <option value="rejected">Rejected</option>
//                   </select>
//                 </div>
//               </div>
//             </div>

//             <div style={{ textAlign: "center", marginTop: "20px" }}>
//               <button
//                 type="button"
//                 onClick={handleSubmit}
//                 style={submitButtonStyle}
//                 disabled={loading}
//               >
//                 {loading ? "Updating..." : "Update"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditLeaveRequest;
