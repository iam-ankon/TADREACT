// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeLeaves } from "../../api/employeeApi";

const Dashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const mode = localStorage.getItem("mode");
    if (mode === "full_access") {
      navigate("/hr-work", { replace: true });
      return;
    }
    fetchLeaves();
  }, [navigate]);

  const fetchLeaves = async () => {
    try {
      const data = await getEmployeeLeaves();  // ← This is now the array

      // SAFETY: Always ensure it's an array
      if (Array.isArray(data)) {
        setLeaves(data);
      } else {
        console.error("API did not return an array:", data);
        setLeaves([]);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      setError("Could not load leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading your leaves...</div>;
  if (error) return <div className="text-red-600 text-center p-4">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Leave Dashboard</h1>
        <p className="text-gray-600 mt-1">
          You can only view and manage <strong>your own</strong> leave requests.
        </p>
      </div>

      {leaves.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No leave requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{leave.leave_type.replace(/_/g, " ")}</h3>
                  <p className="text-sm text-gray-600">
                    {leave.start_date} → {leave.end_date} ({leave.leave_days} day{leave.leave_days > 1 ? "s" : ""})
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    leave.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : leave.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {leave.status}
                </span>
              </div>
              {leave.reason && (
                <p className="mt-3 text-gray-700">
                  <strong>Reason:</strong> {leave.reason}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Applied by: <strong>{leave.employee_name}</strong> ({leave.designation})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;