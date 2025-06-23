import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import Sidebars from './sidebars';
import { FaPlus, FaPrint, FaTrash, FaPaperclip, FaSearch } from "react-icons/fa";

const EmployeeDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await getEmployees();
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleRowClick = (id) => {
    navigate(`/employee/${id}`);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter((employee) => employee.id !== id));
      } catch (error) {
        console.error("Error deleting employee", error);
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #0078d4; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0078d4; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .print-footer { margin-top: 20px; text-align: right; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Employee List</h1>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Company</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEmployees.map(employee => `
                <tr>
                  <td>${employee.employee_id || ''}</td>
                  <td>${employee.name || ''}</td>
                  <td>${employee.designation || ''}</td>
                  <td>${employee.department || ''}</td>
                  <td>${employee.company_name || ''}</td>
                  <td>${employee.salary ? '$' + employee.salary : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="print-footer">
            Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };


  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employee_id?.toString().includes(searchQuery) ||
      employee.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  

  return (
    <div className="employee-list-container">
      <div className="sidebar-wrapper">
        <Sidebars />
        <div className="content-wrapper">
          <div className="employee-list-card">
            <div className="employee-header">
              <h2>Employee Directory</h2>
              <div className="action-buttons">
                <button 
                  onClick={() => navigate("/add-employee")} 
                  className="btn-add"
                >
                  <FaPlus /> Add Employee
                </button>
                <button 
                  onClick={handlePrint} 
                  className="btn-print"
                >
                  <FaPrint /> Print
                </button>
              </div>
            </div>

            <div className="search-container">
              <div className="search-input">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((employee) => (
                      <tr 
                        key={employee.id} 
                        onClick={() => handleRowClick(employee.id)}
                        className="employee-row"
                      >
                        <td>{employee.employee_id}</td>
                        <td>{employee.name}</td>
                        <td>{employee.designation}</td>
                        <td>{employee.department}</td>
                        <td>{employee.company_name}</td>
                        <td className="action-buttons-cell">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employee/${employee.id}/attachments`);
                            }}
                            className="btn-attachment"
                          >
                            <FaPaperclip /> Attach
                          </button>
                          <button
                            onClick={(e) => handleDelete(employee.id, e)}
                            className="btn-delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-results">
                        No employees found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .employee-list-container {
          display: flex;
          min-height: 100vh;
          background-color: #A7D5E1;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .sidebar-wrapper {
          display: flex;
          width: 100%;
        }

        .content-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .employee-list-card {
          background: #DCEEF3;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .employee-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 1rem;
        }

        .employee-header h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.8rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.8rem;
        }

        .action-buttons button {
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .btn-add {
          background-color:rgb(75, 154, 214);
          color: white;
        }

        .btn-add:hover {
          background-color: #005a9e;
        }

        .btn-print {
          background-color: #107c10;
          color: white;
        }

        .btn-print:hover {
          background-color: #0e5e0e;
        }

        .search-container {
          margin-bottom: 1.5rem;
        }

        .search-input {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .search-input input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .search-input input:focus {
          outline: none;
          border-color: #0078d4;
        }

        .search-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .employee-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          font-size: 0.95rem;
        }

        .employee-table th {
          background-color:rgb(95, 145, 183);
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          position: sticky;
          
        }

        .employee-table td {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          color: #333;
        }

        .employee-row {
          transition: background-color 0.2s;
        }

        .employee-row:hover {
          background-color: #f0f4f8 !important;
          cursor: pointer;
        }

        .employee-row:nth-child(even) {
          background-color: #f9f9f9;
        }

        .action-buttons-cell {
          display: flex;
          gap: 0.5rem;
        }

        .action-buttons-cell button {
          padding: 0.4rem 0.8rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.2s;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .btn-attachment {
          background-color: #5f6368;
          color: white;
        }

        .btn-attachment:hover {
          background-color: #4a4d51;
        }

        .btn-delete {
          background-color: #e53935;
          color: white;
        }

        .btn-delete:hover {
          background-color: #c62828;
        }

        .no-results {
          text-align: center;
          padding: 1.5rem;
          color: #666;
        }

        .pagination {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
          gap: 0.5rem;
        }

        .page-btn {
          padding: 0.5rem 0.8rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover {
          background-color: #f0f0f0;
        }

        .page-btn.active {
          background-color: #0078d4;
          color: white;
          border-color: #0078d4;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #0078d4;
        }

        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .sidebar-wrapper {
            display: none;
          }

          .action-buttons, .btn-delete, .btn-attachment {
            display: none !important;
          }

          .employee-list-card {
            box-shadow: none;
            padding: 0;
            max-width: 100%;
          }

          .employee-table {
            font-size: 12px;
          }

          .employee-table th, .employee-table td {
            padding: 0.5rem;
          }
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .employee-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .action-buttons {
            width: 100%;
            flex-direction: column;
          }

          .action-buttons button {
            width: 100%;
            justify-content: center;
          }

          .search-input {
            max-width: 100%;
          }

          .action-buttons-cell {
            flex-direction: column;
            gap: 0.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetails;