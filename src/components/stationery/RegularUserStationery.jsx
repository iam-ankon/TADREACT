// RegularUserStationery.jsx - ULTIMATE FIX FOR REALTIME UPDATES
import React, { useState, useEffect } from "react";
import axios from "axios";

const RegularUserStationery = () => {
  const [items, setItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0); // Used to force re-render

  // Form state
  const [requestForm, setRequestForm] = useState({
    stationery_item: "",
    quantity: 1,
    purpose: "",
    remarks: "",
  });

  // API Configuration
  const API_BASE = "http://119.148.51.38:8000/api/hrms/api/";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    };
  };

  const getCSRFToken = () => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1] || ""
    );
  };

  // Enhanced fetch current employee
  const fetchCurrentEmployee = async () => {
    try {
      const response = await axios.get(`${API_BASE}current_employee/`, {
        headers: getAuthHeaders(),
        params: {
          employee_id: localStorage.getItem("employee_id") || "",
          _t: Date.now(),
        },
      });

      setCurrentEmployee(response.data);
      return response.data;
    } catch (err) {
      return null;
    }
  };

  // Enhanced fetch stationery items
  const fetchStationeryItems = async () => {
    try {
      const response = await axios.get(`${API_BASE}stationery_items/`, {
        headers: getAuthHeaders(),
        params: { _t: Date.now() },
      });

      const data = response.data;

      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.results)) {
        setItems(data.results);
      } else if (data && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      setError("Failed to load stationery items");
      setItems([]);
    }
  };

  // CRITICAL FIX: Enhanced fetch my requests with multiple fallbacks
  const fetchMyRequests = async () => {
    try {
      if (!currentEmployee?.id) {
        setMyRequests([]);
        return;
      }

      const response = await axios.get(`${API_BASE}stationery_usage/`, {
        headers: getAuthHeaders(),
        params: {
          _t: Date.now(),
          employee: currentEmployee.id,
        },
      });

      let requestsData = [];

      // Try multiple response format patterns
      if (Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response.data && typeof response.data === "object") {
        // Handle object with nested array

        if (Array.isArray(response.data.results)) {
          requestsData = response.data.results;
        } else if (Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        } else if (Array.isArray(response.data.stationery_usage)) {
          requestsData = response.data.stationery_usage;
        } else {
          // Maybe it's a single object? Check if it looks like a stationery usage record
          if (response.data.id && response.data.stationery_item) {
            requestsData = [response.data]; // Wrap single object in array
          } else {
            // Try to extract any array from the object
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                requestsData = response.data[key];

                break;
              }
            }
          }
        }
      }

      // Process and enhance each request
      const enhancedRequests = requestsData.map((req, index) => {
        // Get stationery item name from items array if available
        let stationeryName =
          req.stationery_name ||
          req.stationery_item_name ||
          req.stationery_item?.name;

        // If still not found, try to find in items array
        if (!stationeryName && items.length > 0) {
          const foundItem = items.find(
            (item) => item.id === req.stationery_item
          );
          stationeryName = foundItem?.name || `Item #${req.stationery_item}`;
        }

        const enhancedReq = {
          id: req.id || `temp-${Date.now()}-${index}`,
          stationery_item: req.stationery_item,
          quantity: req.quantity || 1,
          purpose: req.purpose || "",
          remarks: req.remarks || "",
          status: req.status || "pending",
          date_requested:
            req.date_requested || req.created_at || new Date().toISOString(),
          date_issued: req.date_issued,
          stationery_name: stationeryName || `Item #${req.stationery_item}`,
          unit: req.unit || "pcs",
          employee: req.employee,
          employee_name: req.employee_name || currentEmployee?.name || "You",
        };

        return enhancedReq;
      });

      // Sort by date (newest first)
      const sortedRequests = enhancedRequests.sort((a, b) => {
        return new Date(b.date_requested) - new Date(a.date_requested);
      });

      // CRITICAL: Force state update
      setMyRequests(sortedRequests);

      // Force a re-render
      setForceRefresh((prev) => prev + 1);

      return sortedRequests;
    } catch (err) {
      setError(`Failed to load requests: ${err.message}`);
      setMyRequests([]);
      return [];
    }
  };

  // Initial data load
  useEffect(() => {
    const init = async () => {
      await fetchCurrentEmployee();
      await fetchStationeryItems();
      await fetchMyRequests();
    };
    init();
  }, []);

  // Force refresh when employee changes
  useEffect(() => {
    if (currentEmployee) {
      console.log("👤 EMPLOYEE CHANGED, REFRESHING REQUESTS...");
      fetchMyRequests();
    }
  }, [currentEmployee]);

  // ULTIMATE FIX: Handle form submission with guaranteed frontend update
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate form
    if (!requestForm.stationery_item) {
      setError("Please select a stationery item");
      setLoading(false);
      return;
    }

    if (!requestForm.purpose.trim()) {
      setError("Please provide a purpose for your request");
      setLoading(false);
      return;
    }

    // Prepare the request data
    const requestData = {
      stationery_item: parseInt(requestForm.stationery_item),
      quantity: parseInt(requestForm.quantity) || 1,
      purpose: requestForm.purpose.trim(),
      remarks: requestForm.remarks.trim(),
      employee: currentEmployee?.id,
    };

    console.log("📤 SUBMITTING REQUEST:", requestData);
    console.log("Employee ID:", currentEmployee?.id);

    try {
      const response = await axios.post(
        `${API_BASE}stationery_usage/`,
        requestData,
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("✅ SUBMISSION RESPONSE:", response);
      console.log("📊 RESPONSE DATA:", response.data);

      setSuccess("✅ Stationery request submitted successfully!");

      // Reset form
      setRequestForm({
        stationery_item: "",
        quantity: 1,
        purpose: "",
        remarks: "",
      });

      // CRITICAL PART: Create a temporary request object IMMEDIATELY
      const selectedItem = items.find(
        (item) => item.id == requestForm.stationery_item
      );

      const tempRequest = {
        id: response.data?.id || `temp-${Date.now()}`,
        stationery_item: parseInt(requestForm.stationery_item),
        stationery_name:
          selectedItem?.name || `Item #${requestForm.stationery_item}`,
        quantity: parseInt(requestForm.quantity) || 1,
        purpose: requestForm.purpose.trim(),
        remarks: requestForm.remarks.trim(),
        status: "pending",
        date_requested: new Date().toISOString(),
        unit: selectedItem?.unit || "pcs",
        employee: currentEmployee?.id,
        employee_name: currentEmployee?.name || "You",
        isTemp: true,
      };

      console.log("🆕 TEMP REQUEST CREATED:", tempRequest);

      // IMMEDIATELY add to frontend
      setMyRequests((prev) => {
        const newRequests = [tempRequest, ...prev];
        console.log("🔄 UPDATED REQUESTS STATE:", newRequests.length, "items");
        return newRequests;
      });

      // Force refresh after 1 second to get real data from backend
      setTimeout(async () => {
        console.log("🔄 FORCING DATA REFRESH FROM SERVER...");
        try {
          await fetchMyRequests();
          // Also update stock
          await fetchStationeryItems();
        } catch (refreshErr) {
          console.error("Refresh error:", refreshErr);
        }
      }, 1000);

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("❌ SUBMISSION ERROR:", err);
      console.error("Error response:", err.response);

      let errorMessage = "Failed to submit request.";

      if (err.response?.data) {
        if (typeof err.response.data === "object") {
          if (err.response.data.error) errorMessage = err.response.data.error;
          else if (err.response.data.detail)
            errorMessage = err.response.data.detail;
          else if (err.response.data.non_field_errors) {
            errorMessage = err.response.data.non_field_errors.join(", ");
          }
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh all data
  const refreshAllData = async () => {
    console.log("🔄 FORCE REFRESHING ALL DATA...");
    try {
      await Promise.all([
        fetchCurrentEmployee(),
        fetchStationeryItems(),
        fetchMyRequests(),
      ]);
      setSuccess("✅ Data refreshed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Refresh error:", err);
      setError("Failed to refresh data");
    }
  };

  // Direct database query test

  // Get stock status
  const getStockStatus = (item) => {
    if (!item) return { color: "#9ca3af", label: "Unknown", bg: "#f3f4f6" };
    if (item.current_stock <= 0) {
      return { color: "#ef4444", label: "Out of Stock", bg: "#fef2f2" };
    } else if (item.current_stock <= item.reorder_level) {
      return { color: "#f97316", label: "Low Stock", bg: "#fff7ed" };
    } else {
      return { color: "#10b981", label: "In Stock", bg: "#f0fdf4" };
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      approved: { bg: "#dbeafe", color: "#1e40af" },
      issued: { bg: "#d1fae5", color: "#065f46" },
      rejected: { bg: "#fee2e2", color: "#991b1b" },
      completed: { bg: "#f3f4f6", color: "#6b7280" },
    };
    return colors[status] || { bg: "#f3f4f6", color: "#6b7280" };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "20px 40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h1 style={{ margin: "0", fontSize: "24px", fontWeight: "600" }}>
              📦 Stationery Request Portal
            </h1>
            <p
              style={{ margin: "5px 0 0", color: "#dbeafe", fontSize: "14px" }}
            >
              {currentEmployee
                ? `Welcome, ${currentEmployee.name}`
                : "Request stationery items"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={refreshAllData}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🔄 Refresh All
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 20px" }}
      >
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>❌</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                cursor: "pointer",
                fontSize: "18px",
                padding: "0 5px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✅</span>
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              style={{
                background: "none",
                border: "none",
                color: "#16a34a",
                cursor: "pointer",
                fontSize: "18px",
                padding: "0 5px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Employee Info Banner */}
        {currentEmployee && (
          <div
            style={{
              backgroundColor: "#dbeafe",
              border: "1px solid #93c5fd",
              color: "#1e40af",
              padding: "10px 16px",
              borderRadius: "6px",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>👤</span>
                <div>
                  <strong>{currentEmployee.name}</strong> •{" "}
                  {currentEmployee.designation}
                  <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                    {currentEmployee.department?.department_name ||
                      "No Department"}{" "}
                    • ID: {currentEmployee.employee_id}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "15px", fontSize: "13px" }}>
                <div>
                  <strong>Requests:</strong> {myRequests.length}
                </div>
                <div>
                  <strong>Pending:</strong>{" "}
                  {myRequests.filter((r) => r.status === "pending").length}
                </div>
                <div>
                  <strong>DB ID:</strong> {currentEmployee.id}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px 40px",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
            marginTop: "20px",
          }}
        >
          {/* Left Column: Request Form */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "25px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                color: "#1f2937",
                fontSize: "18px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              📝 New Request
            </h2>

            {!currentEmployee ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "3px solid #e5e7eb",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 15px",
                  }}
                ></div>
                <p>Loading your profile...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest}>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Stationery Item *
                  </label>
                  <select
                    value={requestForm.stationery_item}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        stationery_item: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                    required
                    disabled={loading}
                  >
                    <option value="">Select an item...</option>
                    {items.map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={item.current_stock <= 0}
                        >
                          {item.name} - {status.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={requestForm.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setRequestForm({
                        ...requestForm,
                        quantity: value > 0 ? value : 1,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Purpose *
                  </label>
                  <textarea
                    value={requestForm.purpose}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        purpose: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                    placeholder="Please describe why you need this item..."
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ marginBottom: "25px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Additional Remarks (Optional)
                  </label>
                  <textarea
                    value={requestForm.remarks}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        remarks: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      minHeight: "60px",
                      resize: "vertical",
                    }}
                    placeholder="Any additional information..."
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    loading || !currentEmployee || !requestForm.stationery_item
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor:
                      loading ||
                      !currentEmployee ||
                      !requestForm.stationery_item
                        ? "#9ca3af"
                        : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      loading ||
                      !currentEmployee ||
                      !requestForm.stationery_item
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      !loading &&
                      currentEmployee &&
                      requestForm.stationery_item
                    ) {
                      e.target.style.backgroundColor = "#2563eb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      !loading &&
                      currentEmployee &&
                      requestForm.stationery_item
                    ) {
                      e.target.style.backgroundColor = "#3b82f6";
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          animation: "spin 1s linear infinite",
                        }}
                      >
                        ↻
                      </span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: My Requests & Items */}
          <div>
            {/* My Requests */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "25px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #e5e7eb",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    margin: "0",
                    color: "#1f2937",
                    fontSize: "18px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  📋 My Requests
                  <span
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {myRequests.length}
                  </span>
                </h2>
              </div>

              {myRequests.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#6b7280",
                    border: "2px dashed #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                    📭
                  </div>
                  <p style={{ fontSize: "16px", marginBottom: "5px" }}>
                    No requests yet
                  </p>
                  <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                    Submit your first request using the form on the left
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  {myRequests.map((request, index) => {
                    const statusStyle = getStatusColor(request.status);
                    const isTemp =
                      request.id && request.id.toString().startsWith("temp-");

                    return (
                      <div
                        key={request.id || index}
                        style={{
                          padding: "15px",
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: isTemp
                            ? "#fefce8"
                            : request.status === "pending"
                            ? "#fefce8"
                            : request.status === "approved"
                            ? "#eff6ff"
                            : request.status === "issued"
                            ? "#f0fdf4"
                            : request.status === "rejected"
                            ? "#fef2f2"
                            : "white",
                          borderLeft: isTemp
                            ? "4px solid #f59e0b"
                            : request.status === "pending"
                            ? "4px solid #f59e0b"
                            : request.status === "approved"
                            ? "4px solid #3b82f6"
                            : request.status === "issued"
                            ? "4px solid #10b981"
                            : request.status === "rejected"
                            ? "4px solid #ef4444"
                            : "4px solid #9ca3af",
                          marginBottom: "10px",
                          borderRadius: "0 8px 8px 0",
                          animation: isTemp ? "pulse 2s infinite" : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "10px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#1f2937",
                                fontSize: "15px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {request.stationery_name}
                              {isTemp && (
                                <span
                                  style={{
                                    backgroundColor: "#f59e0b",
                                    color: "white",
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                  }}
                                >
                                  TEMP
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                marginTop: "4px",
                              }}
                            >
                              ID: {request.id} • Qty: {request.quantity}{" "}
                              {request.unit || "pcs"}
                            </div>
                          </div>
                          <div>
                            <span
                              style={{
                                padding: "4px 10px",
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                              }}
                            >
                              {request.status || "PENDING"}
                            </span>
                          </div>
                        </div>

                        {request.purpose && (
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#4b5563",
                              marginBottom: "8px",
                              padding: "8px",
                              backgroundColor: "rgba(255,255,255,0.7)",
                              borderRadius: "6px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#3b82f6",
                                marginBottom: "2px",
                              }}
                            >
                              Purpose:
                            </div>
                            <div>{request.purpose}</div>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                            color: "#9ca3af",
                          }}
                        >
                          <div>{formatDate(request.date_requested)}</div>
                          <div>{request.employee_name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px",
                  color: "#1f2937",
                  fontSize: "16px",
                }}
              >
                📊 Quick Stats
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "#3b82f6",
                    }}
                  >
                    {myRequests.length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Total Requests
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "#92400e",
                    }}
                  >
                    {myRequests.filter((r) => r.status === "pending").length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#92400e" }}>
                    Pending
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "#1e40af",
                    }}
                  >
                    {myRequests.filter((r) => r.status === "approved").length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#1e40af" }}>
                    Approved
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#d1fae5",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "#065f46",
                    }}
                  >
                    {myRequests.filter((r) => r.status === "issued").length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#065f46" }}>
                    Issued
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#f3f4f6",
          borderTop: "1px solid #e5e7eb",
          padding: "20px",
          marginTop: "40px",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <p style={{ margin: "0" }}>
                Stationery Request System • {new Date().toLocaleDateString()}
              </p>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Employee: {currentEmployee?.name || "Not loaded"} • Force
                Refresh: {forceRefresh}
              </p>
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Data will appear immediately after submission
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        select:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        textarea:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default RegularUserStationery;
