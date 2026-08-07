// ArchivedEmployees.jsx
import React, { useState, useEffect } from 'react';

const ArchivedEmployees = () => {
  const [archived, setArchived] = useState([]);
  
  useEffect(() => {
    fetchArchivedEmployees();
  }, []);
  
  const fetchArchivedEmployees = async () => {
    try {
      const response = await fetch('/api/employees/archived/');
      const data = await response.json();
      setArchived(data);
    } catch (error) {
      console.error('Error fetching archived employees:', error);
    }
  };
  
  return (
    <div>
      <h2>Terminated Employee Archive</h2>
      <table>
        <thead>
          <tr>
            <th>Original ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Termination Date</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {archived.map(emp => (
            <tr key={emp.id}>
              <td>{emp.original_employee_id}</td>
              <td>{emp.name}</td>
              <td>{emp.department_name}</td>
              <td>{emp.termination_date}</td>
              <td>{emp.reason_for_termination}</td>
              <td>
                <button onClick={() => viewDetails(emp.id)}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArchivedEmployees;