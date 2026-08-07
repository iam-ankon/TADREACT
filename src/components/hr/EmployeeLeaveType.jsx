import React, { useEffect, useState } from "react";
import { 
  getEmployeeLeaveTypes, 
  updateEmployeeLeaveType 
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EmployeeLeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const response = await getEmployeeLeaveTypes();
      setLeaveTypes(response.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      alert("Failed to load leave types. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (id, field, value) => {
    setEditingField({ id, field });
    setEditValue(value);
  };

  const handleBlur = async () => {
    if (!editingField) return;

    try {
      const currentLeave = leaveTypes.find(
        (leave) => leave.id === editingField.id
      );
      const updatedLeave = {
        ...currentLeave,
        [editingField.field]: editValue,
      };

      await updateEmployeeLeaveType(editingField.id, updatedLeave);
      setEditingField(null);
      setEditValue("");
      fetchLeaveTypes();
      alert("Leave type updated successfully!");
    } catch (error) {
      console.error("Error updating value:", error);
      alert("Failed to update leave type. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditingField(null);
      setEditValue("");
    }
  };

  const renderCell = (leave, field) => {
    if (
      editingField &&
      editingField.id === leave.id &&
      editingField.field === field
    ) {
      return (
        <input
          type="number"
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading leave types...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.content}>
        <div style={styles.tableContainer}>
          <h2 style={styles.heading}>Employee Leave Types</h2>
          {leaveTypes.length > 0 ? (
            leaveTypes.map((leave) => (
              <table key={leave.id} style={styles.table}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f3f5" }}>
                    <th style={styles.th}>Leave Type</th>
                    <th style={styles.th}>Days</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Public Festival Holiday</td>
                    <td style={styles.td}>
                      {renderCell(leave, "public_festival_holiday")}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Casual Leave</td>
                    <td style={styles.td}>{renderCell(leave, "casual_leave")}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Sick Leave</td>
                    <td style={styles.td}>{renderCell(leave, "sick_leave")}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Earned Leave</td>
                    <td style={styles.td}>{renderCell(leave, "earned_leave")}</td>
                  </tr>
                </tbody>
              </table>
            ))
          ) : (
            <div style={styles.noData}>No leave types found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    backgroundColor: "#A7D5E1",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "18px",
  },
  content: {
    flex: 1,
    padding: "30px",
  },
  tableContainer: {
    padding: "20px 30px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#DCEEF3",
  },
  heading: {
    fontSize: "20px",
    color: "#0078D4",
    marginBottom: "20px",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "30px",
  },
  th: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "2px solid #ddd",
    fontWeight: "bold",
    color: "#333",
    fontSize: "15px",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    color: "#444",
  },
  noData: {
    textAlign: "center",
    padding: "20px",
    color: "#666",
    fontSize: "16px",
  },
};

const cellStyle = {
  cursor: "pointer",
  padding: "6px 10px",
  display: "inline-block",
  color: "#333",
};

const editInputStyle = {
  padding: "6px 10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  width: "80px",
  fontSize: "14px",
};

export default EmployeeLeaveTypes;