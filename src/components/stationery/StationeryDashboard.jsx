// StationeryDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const StationeryDashboard = () => {
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [usage, setUsage] = useState([]);
  const [filteredUsage, setFilteredUsage] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search states
  const [itemsSearch, setItemsSearch] = useState("");
  const [usageSearch, setUsageSearch] = useState("");
  const [transactionsSearch, setTransactionsSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Form states
  const initialItemForm = {
    name: "",
    description: "",
    unit: "pcs",
    reorder_level: 10,
    current_stock: 0,
  };
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [editingItemId, setEditingItemId] = useState(null);

  const [usageForm, setUsageForm] = useState({
    employee: "",
    employee_name: "",
    stationery_item: "",
    quantity: 1,
    purpose: "",
    remarks: "",
    is_order_request: false,
    order_quantity: 0,
  });

  const [transactionForm, setTransactionForm] = useState({
    stationery_item: "",
    transaction_type: "issue",
    quantity: 1,
    employee: "",
    employee_name: "",
    remarks: "",
    reference_number: "",
  });

  const [employees, setEmployees] = useState([]);

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

  // Fetch data functions
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}stationery_items/`, {
        headers: getAuthHeaders(),
      });
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (err) {
      setError("Failed to fetch stationery items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      console.log("🔍 fetchUsage: STARTING");
      setLoading(true);
      const response = await axios.get(`${API_BASE}stationery_usage/`, {
        headers: getAuthHeaders(),
      });
      console.log("✅ fetchUsage: SUCCESS");
      console.log("📊 Response data:", response.data);
      console.log("📊 Data length:", response.data.length);
      console.log("📊 First item (if any):", response.data[0]);
      setUsage(response.data);
      setFilteredUsage(response.data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Failed to fetch usage records";
      console.error("❌ fetchUsage: ERROR", err);
      console.error("❌ Error response:", err.response);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}stationery_transactions/`, {
        headers: getAuthHeaders(),
      });
      setTransactions(response.data);
      setFilteredTransactions(response.data);
    } catch (err) {
      setError("Failed to fetch transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE}employees/`, {
        headers: getAuthHeaders(),
      });
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchItems();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === "usage") fetchUsage();
    if (activeTab === "transactions") fetchTransactions();
  }, [activeTab]);

  // Search functions
  useEffect(() => {
    if (itemsSearch.trim() === "") {
      setFilteredItems(items);
    } else {
      const searchTerm = itemsSearch.toLowerCase();
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.unit.toLowerCase().includes(searchTerm)
      );
      setFilteredItems(filtered);
    }
  }, [itemsSearch, items]);

  useEffect(() => {
    if (usageSearch.trim() === "") {
      setFilteredUsage(usage);
    } else {
      const searchTerm = usageSearch.toLowerCase();
      const filtered = usage.filter(
        (record) =>
          record.employee_name?.toLowerCase().includes(searchTerm) ||
          record.stationery_name?.toLowerCase().includes(searchTerm) ||
          record.purpose?.toLowerCase().includes(searchTerm) ||
          record.status?.toLowerCase().includes(searchTerm) ||
          record.employee_id?.toLowerCase().includes(searchTerm)
      );
      setFilteredUsage(filtered);
    }
  }, [usageSearch, usage]);

  useEffect(() => {
    if (transactionsSearch.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const searchTerm = transactionsSearch.toLowerCase();
      const filtered = transactions.filter(
        (transaction) =>
          transaction.stationery_name?.toLowerCase().includes(searchTerm) ||
          transaction.employee_name?.toLowerCase().includes(searchTerm) ||
          transaction.transaction_type?.toLowerCase().includes(searchTerm) ||
          transaction.reference_number?.toLowerCase().includes(searchTerm) ||
          transaction.remarks?.toLowerCase().includes(searchTerm)
      );
      setFilteredTransactions(filtered);
    }
  }, [transactionsSearch, transactions]);

  useEffect(() => {
    if (employeeSearch.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const searchTerm = employeeSearch.toLowerCase();
      const filtered = employees.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchTerm) ||
          emp.employee_id?.toLowerCase().includes(searchTerm)
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearch, employees]);

  // Handle employee selection
  const selectEmployee = (employeeId, employeeName) => {
    setUsageForm({
      ...usageForm,
      employee: employeeId,
      employee_name: employeeName,
    });
    setTransactionForm({
      ...transactionForm,
      employee: employeeId,
      employee_name: employeeName,
    });
    setShowEmployeeDropdown(false);
  };

  // Handle edit item
  const handleEditItem = (item) => {
    setItemForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      reorder_level: item.reorder_level,
      current_stock: item.current_stock,
    });
    setEditingItemId(item.id);
  };

  const handleCancelEdit = () => {
    setItemForm(initialItemForm);
    setEditingItemId(null);
  };

  // Handle form submissions
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (editingItemId) {
        // Update existing item
        response = await axios.put(
          `${API_BASE}stationery_items/${editingItemId}/`,
          itemForm,
          {
            headers: getAuthHeaders(),
          }
        );
        setSuccess("Stationery item updated successfully!");
      } else {
        // Add new item
        response = await axios.post(`${API_BASE}stationery_items/`, itemForm, {
          headers: getAuthHeaders(),
        });
        setSuccess("Stationery item added successfully!");
      }
      setItemForm(initialItemForm);
      setEditingItemId(null);
      fetchItems();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        editingItemId
          ? "Failed to update stationery item"
          : "Failed to add stationery item"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsage = async (e) => {
    e.preventDefault();
    console.log("🚀 handleAddUsage: STARTING");
    console.log("📤 Form data:", usageForm);

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_BASE}stationery_usage/`,
        usageForm,
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("✅ handleAddUsage: SUCCESS");
      console.log("📥 Response:", response.data);

      setSuccess("Usage request submitted successfully!");

      // Reset form
      setUsageForm({
        employee: "",
        employee_name: "",
        stationery_item: "",
        quantity: 1,
        purpose: "",
        remarks: "",
        is_order_request: false,
        order_quantity: 0,
      });
      setEmployeeSearch("");

      // IMMEDIATELY REFRESH - wait for it to complete
      console.log("🔄 Refreshing usage data...");
      await fetchUsage();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ handleAddUsage: ERROR");
      console.error("❌ Full error:", err);
      console.error("❌ Error response:", err.response?.data);

      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to submit usage request";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${API_BASE}stationery_transactions/`, transactionForm, {
        headers: getAuthHeaders(),
      });
      setSuccess("Transaction recorded successfully!");
      setTransactionForm({
        stationery_item: "",
        transaction_type: "issue",
        quantity: 1,
        employee: "",
        employee_name: "",
        remarks: "",
        reference_number: "",
      });
      setEmployeeSearch("");
      fetchTransactions();
      fetchItems(); // Refresh items as stock changes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to record transaction");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle status updates
  const handleApproveUsage = async (id) => {
    try {
      await axios.post(
        `${API_BASE}stationery_usage/${id}/approve_request/`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      setSuccess("Request approved successfully!");
      fetchUsage();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to approve request");
      console.error(err);
    }
  };

  const handleIssueUsage = async (id) => {
    try {
      await axios.post(
        `${API_BASE}stationery_usage/${id}/issue_item/`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      setSuccess("Item issued successfully!");
      fetchUsage();
      fetchItems(); // Refresh stock
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to issue item");
      console.error(err);
    }
  };

  // Get stock status color
  const getStockStatus = (item) => {
    if (item.current_stock <= 0) {
      return { color: "#ef4444", label: "Out of Stock", bg: "#fef2f2" };
    } else if (item.current_stock <= item.reorder_level) {
      return { color: "#f97316", label: "Low Stock", bg: "#fff7ed" };
    } else {
      return { color: "#10b981", label: "In Stock", bg: "#f0fdf4" };
    }
  };

  // Get transaction type color
  const getTransactionColor = (type) => {
    const colors = {
      issue: "#3b82f6",
      order: "#10b981",
      return: "#8b5cf6",
      adjust: "#f59e0b",
      damage: "#ef4444",
    };
    return colors[type] || "#6b7280";
  };

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "5px solid #e5e7eb",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            Loading stationery data...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1f2937",
          color: "white",
          padding: "20px 40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <div>
            <h1 style={{ margin: "0", fontSize: "28px", fontWeight: "600" }}>
              📦 Stationery Management
            </h1>
            <p
              style={{ margin: "5px 0 0", color: "#d1d5db", fontSize: "14px" }}
            >
              Manage stationery items, usage, and transactions
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                fetchItems();
                fetchUsage();
                fetchTransactions();
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#374151",
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
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "2px",
            padding: "0 40px",
            overflowX: "auto",
          }}
        >
          {["items", "usage", "transactions", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "15px 25px",
                backgroundColor: activeTab === tab ? "#3b82f6" : "transparent",
                color: activeTab === tab ? "white" : "#6b7280",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "3px solid #2563eb"
                    : "3px solid transparent",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {tab === "items" && "📦"}
              {tab === "usage" && "📝"}
              {tab === "transactions" && "🔄"}
              {tab === "reports" && "📊"}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{ maxWidth: "1400px", margin: "20px auto 0", padding: "0 40px" }}
      >
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "15px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>❌ {error}</span>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                cursor: "pointer",
                fontSize: "18px",
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
              padding: "15px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            ✅ {success}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1400px",
          margin: "20px auto",
          padding: "0 40px",
        }}
      >
        {/* Stationery Items Tab */}
        {activeTab === "items" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "30px",
              }}
            >
              {/* Add/Edit Item Form */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "25px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px",
                    color: "#1f2937",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                >
                  {editingItemId
                    ? "✏️ Edit Stationery Item"
                    : "➕ Add New Stationery Item"}
                </h2>
                <form onSubmit={handleSubmitItem}>
                  {[
                    "name",
                    "description",
                    "unit",
                    "reorder_level",
                    "current_stock",
                  ].map((field) => (
                    <div key={field} style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "6px",
                          color: "#4b5563",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {field
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </label>
                      {field === "description" ? (
                        <textarea
                          value={itemForm[field]}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              [field]: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            minHeight: "80px",
                            resize: "vertical",
                          }}
                          required={field === "name"}
                        />
                      ) : field === "unit" ? (
                        <select
                          value={itemForm[field]}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              [field]: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            backgroundColor: "white",
                          }}
                        >
                          {[
                            "pcs",
                            "box",
                            "packet",
                            "ream",
                            "bottle",
                            "set",
                          ].map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            field === "current_stock" ||
                            field === "reorder_level"
                              ? "number"
                              : "text"
                          }
                          value={itemForm[field]}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              [field]: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                          required={field === "name"}
                          min={0}
                        />
                      )}
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "15px",
                        fontWeight: "500",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading
                        ? "Processing..."
                        : editingItemId
                        ? "Update Stationery Item"
                        : "Add Stationery Item"}
                    </button>
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          flex: 1,
                          padding: "12px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "15px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Items List */}
              <div>
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
                      fontSize: "20px",
                      fontWeight: "600",
                    }}
                  >
                    📦 Stationery Items ({filteredItems.length})
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="🔍 Search items..."
                      value={itemsSearch}
                      onChange={(e) => setItemsSearch(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        width: "250px",
                      }}
                    />
                    <div style={{ color: "#6b7280", fontSize: "14px" }}>
                      {
                        filteredItems.filter(
                          (i) => i.current_stock <= i.reorder_level
                        ).length
                      }{" "}
                      items need reorder
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.5fr",
                      padding: "15px 20px",
                      backgroundColor: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    <div>Item Name</div>
                    <div>Unit</div>
                    <div>Current Stock</div>
                    <div>Reorder Level</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                    {filteredItems.map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.5fr",
                            padding: "15px 20px",
                            borderBottom: "1px solid #f3f4f6",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: "500", color: "#1f2937" }}
                            >
                              {item.name}
                            </div>
                            {item.description && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  marginTop: "4px",
                                }}
                              >
                                {item.description.substring(0, 60)}...
                              </div>
                            )}
                          </div>
                          <div style={{ color: "#4b5563" }}>{item.unit}</div>
                          <div style={{ color: "#1f2937", fontWeight: "500" }}>
                            {item.current_stock}
                          </div>
                          <div style={{ color: "#6b7280" }}>
                            {item.reorder_level}
                          </div>
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                backgroundColor: status.bg,
                                color: status.color,
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {status.label}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => handleEditItem(item)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Low Stock Warning */}
                {filteredItems.filter((i) => i.current_stock <= i.reorder_level)
                  .length > 0 && (
                  <div
                    style={{
                      marginTop: "20px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      padding: "15px 20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#92400e",
                        marginBottom: "10px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>⚠️</span>
                      <span style={{ fontWeight: "500" }}>Low Stock Alert</span>
                    </div>
                    <div style={{ color: "#92400e", fontSize: "14px" }}>
                      The following items need to be reordered:
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                          marginTop: "10px",
                        }}
                      >
                        {filteredItems
                          .filter((i) => i.current_stock <= i.reorder_level)
                          .map((item) => (
                            <span
                              key={item.id}
                              style={{
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "13px",
                              }}
                            >
                              {item.name} ({item.current_stock} left)
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === "usage" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "30px",
              }}
            >
              {/* Add Usage Form */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "25px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px",
                    color: "#1f2937",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                >
                  📝 Request Stationery
                </h2>
                <form onSubmit={handleAddUsage}>
                  <div style={{ marginBottom: "15px", position: "relative" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Employee
                    </label>
                    <input
                      type="text"
                      placeholder="🔍 Search employee..."
                      value={
                        usageForm.employee
                          ? `${usageForm.employee_name} (Selected)`
                          : employeeSearch
                      }
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                    />
                    {showEmployeeDropdown && filteredEmployees.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 1000,
                        }}
                      >
                        {filteredEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => selectEmployee(emp.id, emp.name)}
                            style={{
                              padding: "10px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f3f4f6",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "white")
                            }
                          >
                            <div>
                              <div style={{ fontWeight: "500" }}>
                                {emp.name}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#6b7280" }}
                              >
                                ID: {emp.employee_id}
                              </div>
                            </div>
                            {usageForm.employee === emp.id && (
                              <span style={{ color: "#10b981" }}>✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Stationery Item
                    </label>
                    <select
                      value={usageForm.stationery_item}
                      onChange={(e) =>
                        setUsageForm({
                          ...usageForm,
                          stationery_item: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "white",
                      }}
                      required
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.current_stock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={usageForm.quantity}
                      onChange={(e) =>
                        setUsageForm({
                          ...usageForm,
                          quantity: parseInt(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                      min="1"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Purpose
                    </label>
                    <textarea
                      value={usageForm.purpose}
                      onChange={(e) =>
                        setUsageForm({ ...usageForm, purpose: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={usageForm.is_order_request}
                        onChange={(e) =>
                          setUsageForm({
                            ...usageForm,
                            is_order_request: e.target.checked,
                          })
                        }
                        style={{ width: "16px", height: "16px" }}
                      />
                      <span style={{ color: "#4b5563", fontSize: "14px" }}>
                        This is an order request (stock replenishment)
                      </span>
                    </label>
                  </div>

                  {usageForm.is_order_request && (
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "6px",
                          color: "#4b5563",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Order Quantity
                      </label>
                      <input
                        type="number"
                        value={usageForm.order_quantity}
                        onChange={(e) =>
                          setUsageForm({
                            ...usageForm,
                            order_quantity: parseInt(e.target.value),
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                        min="1"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "15px",
                      fontWeight: "500",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              </div>

              {/* Usage List */}
              <div>
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
                      fontSize: "20px",
                      fontWeight: "600",
                    }}
                  >
                    📝 Usage Requests ({filteredUsage.length})
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="🔍 Search usage..."
                      value={usageSearch}
                      onChange={(e) => setUsageSearch(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        width: "250px",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ color: "#3b82f6" }}>
                        Pending:{" "}
                        {
                          filteredUsage.filter((u) => u.status === "pending")
                            .length
                        }
                      </span>
                      <span style={{ color: "#10b981" }}>
                        Approved:{" "}
                        {
                          filteredUsage.filter((u) => u.status === "approved")
                            .length
                        }
                      </span>
                      <span style={{ color: "#6b7280" }}>
                        Issued:{" "}
                        {
                          filteredUsage.filter((u) => u.status === "issued")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                      padding: "15px 20px",
                      backgroundColor: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    <div>Employee</div>
                    <div>Item</div>
                    <div>Quantity</div>
                    <div>Date</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                    {filteredUsage.map((record) => {
                      const statusColors = {
                        pending: { bg: "#fef3c7", color: "#92400e" },
                        approved: { bg: "#dbeafe", color: "#1e40af" },
                        issued: { bg: "#d1fae5", color: "#065f46" },
                        rejected: { bg: "#fee2e2", color: "#991b1b" },
                      };
                      const statusStyle = statusColors[record.status] || {
                        bg: "#f3f4f6",
                        color: "#6b7280",
                      };

                      return (
                        <div
                          key={record.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                            padding: "15px 20px",
                            borderBottom: "1px solid #f3f4f6",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: "500", color: "#1f2937" }}
                            >
                              {record.employee_name}
                            </div>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>
                              {record.employee_id}
                            </div>
                          </div>
                          <div style={{ color: "#4b5563" }}>
                            {record.stationery_name}
                          </div>
                          <div style={{ color: "#1f2937", fontWeight: "500" }}>
                            {record.quantity}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "13px" }}>
                            {new Date(
                              record.date_requested
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {record.status.charAt(0).toUpperCase() +
                                record.status.slice(1)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {record.status === "pending" && (
                              <button
                                onClick={() => handleApproveUsage(record.id)}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontWeight: "500",
                                }}
                              >
                                Approve
                              </button>
                            )}
                            {record.status === "approved" && (
                              <button
                                onClick={() => handleIssueUsage(record.id)}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#3b82f6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  fontWeight: "500",
                                }}
                              >
                                Issue
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "30px",
              }}
            >
              {/* Add Transaction Form */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "25px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px",
                    color: "#1f2937",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                >
                  🔄 Record Transaction
                </h2>
                <form onSubmit={handleAddTransaction}>
                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Transaction Type
                    </label>
                    <select
                      value={transactionForm.transaction_type}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          transaction_type: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "white",
                      }}
                      required
                    >
                      {[
                        { value: "issue", label: "Issue to Employee" },
                        { value: "order", label: "Order Received" },
                        { value: "return", label: "Return from Employee" },
                        { value: "adjust", label: "Stock Adjustment" },
                        { value: "damage", label: "Damaged/Lost" },
                      ].map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Stationery Item
                    </label>
                    <select
                      value={transactionForm.stationery_item}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          stationery_item: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "white",
                      }}
                      required
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Current: {item.current_stock} {item.unit}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={transactionForm.quantity}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          quantity: parseInt(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                      min="1"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "15px", position: "relative" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Employee (if applicable)
                    </label>
                    <input
                      type="text"
                      placeholder="🔍 Search employee..."
                      value={
                        transactionForm.employee
                          ? `${transactionForm.employee_name} (Selected)`
                          : employeeSearch
                      }
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setShowEmployeeDropdown(true);
                        if (!e.target.value) {
                          setTransactionForm({
                            ...transactionForm,
                            employee: "",
                            employee_name: "",
                          });
                        }
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                    />
                    {showEmployeeDropdown && filteredEmployees.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 1000,
                        }}
                      >
                        {filteredEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => selectEmployee(emp.id, emp.name)}
                            style={{
                              padding: "10px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f3f4f6",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "white")
                            }
                          >
                            <div>
                              <div style={{ fontWeight: "500" }}>
                                {emp.name}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#6b7280" }}
                              >
                                ID: {emp.employee_id}
                              </div>
                            </div>
                            {transactionForm.employee === emp.id && (
                              <span style={{ color: "#10b981" }}>✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={transactionForm.reference_number}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          reference_number: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                      placeholder="e.g., PO-12345"
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Remarks
                    </label>
                    <textarea
                      value={transactionForm.remarks}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          remarks: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "15px",
                      fontWeight: "500",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "Recording..." : "Record Transaction"}
                  </button>
                </form>
              </div>

              {/* Transactions List */}
              <div>
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
                      fontSize: "20px",
                      fontWeight: "600",
                    }}
                  >
                    🔄 Transaction History ({filteredTransactions.length})
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="🔍 Search transactions..."
                      value={transactionsSearch}
                      onChange={(e) => setTransactionsSearch(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        width: "250px",
                      }}
                    />
                    <div style={{ color: "#6b7280", fontSize: "14px" }}>
                      Last 30 days
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr 1fr 1fr 2fr 1fr",
                      padding: "15px 20px",
                      backgroundColor: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      color: "#4b5563",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    <div>Type</div>
                    <div>Item</div>
                    <div>Quantity</div>
                    <div>Employee</div>
                    <div>Date</div>
                    <div>Reference</div>
                  </div>
                  <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                    {filteredTransactions.map((transaction) => {
                      const color = getTransactionColor(
                        transaction.transaction_type
                      );
                      const typeLabels = {
                        issue: "Issue",
                        order: "Order",
                        return: "Return",
                        adjust: "Adjust",
                        damage: "Damage",
                      };

                      return (
                        <div
                          key={transaction.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 2fr 1fr 1fr 2fr 1fr",
                            padding: "15px 20px",
                            borderBottom: "1px solid #f3f4f6",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                backgroundColor: color + "20",
                                color: color,
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {typeLabels[transaction.transaction_type] ||
                                transaction.transaction_type}
                            </span>
                          </div>
                          <div style={{ color: "#1f2937", fontWeight: "500" }}>
                            {transaction.stationery_name}
                          </div>
                          <div
                            style={{
                              color:
                                transaction.transaction_type === "issue" ||
                                transaction.transaction_type === "damage"
                                  ? "#ef4444"
                                  : "#10b981",
                              fontWeight: "500",
                            }}
                          >
                            {transaction.transaction_type === "issue" ||
                            transaction.transaction_type === "damage"
                              ? "-"
                              : "+"}
                            {transaction.quantity}
                          </div>
                          <div style={{ color: "#4b5563", fontSize: "14px" }}>
                            {transaction.employee_name || "N/A"}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "13px" }}>
                            {new Date(
                              transaction.transaction_date
                            ).toLocaleString()}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "12px" }}>
                            {transaction.reference_number || "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "15px",
                    marginTop: "20px",
                  }}
                >
                  {["issue", "order", "return", "adjust"].map((type) => {
                    const typeData = filteredTransactions.filter(
                      (t) => t.transaction_type === type
                    );
                    const total = typeData.reduce(
                      (sum, t) => sum + t.quantity,
                      0
                    );
                    const color = getTransactionColor(type);

                    return (
                      <div
                        key={type}
                        style={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          padding: "15px",
                          border: "1px solid #e5e7eb",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: color,
                            fontSize: "24px",
                            fontWeight: "600",
                            marginBottom: "5px",
                          }}
                        >
                          {total}
                        </div>
                        <div
                          style={{
                            color: "#4b5563",
                            fontSize: "13px",
                            textTransform: "capitalize",
                          }}
                        >
                          {type} Transactions
                        </div>
                        <div
                          style={{
                            color: "#9ca3af",
                            fontSize: "11px",
                            marginTop: "4px",
                          }}
                        >
                          {typeData.length} records
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "30px",
            }}
          >
            {/* Stock Report */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "25px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  color: "#1f2937",
                  fontSize: "20px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                📊 Stock Report
              </h2>

              <div style={{ marginBottom: "25px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Total Items
                  </span>
                  <span style={{ color: "#1f2937", fontWeight: "500" }}>
                    {items.length}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Items In Stock
                  </span>
                  <span style={{ color: "#10b981", fontWeight: "500" }}>
                    {
                      items.filter((i) => i.current_stock > i.reorder_level)
                        .length
                    }
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Items Low Stock
                  </span>
                  <span style={{ color: "#f97316", fontWeight: "500" }}>
                    {
                      items.filter(
                        (i) =>
                          i.current_stock <= i.reorder_level &&
                          i.current_stock > 0
                      ).length
                    }
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Items Out of Stock
                  </span>
                  <span style={{ color: "#ef4444", fontWeight: "500" }}>
                    {items.filter((i) => i.current_stock <= 0).length}
                  </span>
                </div>
              </div>

              {/* Stock Chart (Simple) */}
              <div
                style={{
                  height: "10px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "5px",
                  overflow: "hidden",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${
                      (items.filter((i) => i.current_stock > i.reorder_level)
                        .length /
                        items.length) *
                      100
                    }%`,
                    backgroundColor: "#10b981",
                    display: "inline-block",
                  }}
                ></div>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      (items.filter(
                        (i) =>
                          i.current_stock <= i.reorder_level &&
                          i.current_stock > 0
                      ).length /
                        items.length) *
                      100
                    }%`,
                    backgroundColor: "#f97316",
                    display: "inline-block",
                  }}
                ></div>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      (items.filter((i) => i.current_stock <= 0).length /
                        items.length) *
                      100
                    }%`,
                    backgroundColor: "#ef4444",
                    display: "inline-block",
                  }}
                ></div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                Green: In Stock | Orange: Low Stock | Red: Out of Stock
              </div>
            </div>

            {/* Usage Statistics */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "25px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  color: "#1f2937",
                  fontSize: "20px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                📈 Usage Statistics
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Total Requests
                  </span>
                  <span style={{ color: "#1f2937", fontWeight: "500" }}>
                    {usage.length}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Pending Requests
                  </span>
                  <span style={{ color: "#f59e0b", fontWeight: "500" }}>
                    {usage.filter((u) => u.status === "pending").length}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Approved Requests
                  </span>
                  <span style={{ color: "#3b82f6", fontWeight: "500" }}>
                    {usage.filter((u) => u.status === "approved").length}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#4b5563", fontSize: "14px" }}>
                    Issued Items
                  </span>
                  <span style={{ color: "#10b981", fontWeight: "500" }}>
                    {usage.filter((u) => u.status === "issued").length}
                  </span>
                </div>
              </div>

              {/* Top Items */}
              <h3
                style={{
                  margin: "25px 0 15px",
                  color: "#374151",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Most Requested Items
              </h3>
              {items
                .map((item) => ({
                  ...item,
                  requestCount: usage.filter(
                    (u) => u.stationery_item === item.id
                  ).length,
                }))
                .sort((a, b) => b.requestCount - a.requestCount)
                .slice(0, 5)
                .map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                      padding: "8px 0",
                      borderBottom: index < 4 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "#1f2937",
                          fontSize: "14px",
                        }}
                      >
                        {index + 1}. {item.name}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#f3f4f6",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        color: "#4b5563",
                      }}
                    >
                      {item.requestCount} requests
                    </div>
                  </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "25px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #e5e7eb",
                gridColumn: "span 2",
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  color: "#1f2937",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                ⚡ Quick Actions
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "15px",
                }}
              >
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: "15px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e5e7eb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                >
                  <span style={{ fontSize: "24px" }}>🖨️</span>
                  <span
                    style={{
                      color: "#1f2937",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Print Report
                  </span>
                </button>

                <button
                  onClick={() => {
                    const csv = items
                      .map(
                        (item) =>
                          `${item.name},${item.current_stock},${item.unit},${item.reorder_level}`
                      )
                      .join("\n");
                    const blob = new Blob(
                      [`Name,Stock,Unit,Reorder Level\n${csv}`],
                      { type: "text/csv" }
                    );
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "stationery-stock-report.csv";
                    a.click();
                  }}
                  style={{
                    padding: "15px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e5e7eb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                >
                  <span style={{ fontSize: "24px" }}>📥</span>
                  <span
                    style={{
                      color: "#1f2937",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Export CSV
                  </span>
                </button>

                <button
                  onClick={() => {
                    const lowStockItems = items.filter(
                      (i) => i.current_stock <= i.reorder_level
                    );
                    if (lowStockItems.length > 0) {
                      const message = `Low stock items:\n${lowStockItems
                        .map(
                          (item) =>
                            `• ${item.name}: ${item.current_stock} ${item.unit} (Reorder at ${item.reorder_level})`
                        )
                        .join("\n")}`;
                      alert(message);
                    } else {
                      alert("All items are sufficiently stocked!");
                    }
                  }}
                  style={{
                    padding: "15px",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e5e7eb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                >
                  <span style={{ fontSize: "24px" }}>⚠️</span>
                  <span
                    style={{
                      color: "#1f2937",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Check Low Stock
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("items")}
                  style={{
                    padding: "15px",
                    backgroundColor: "#3b82f6",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#2563eb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#3b82f6")
                  }
                >
                  <span style={{ fontSize: "24px", color: "white" }}>➕</span>
                  <span
                    style={{
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Add New Item
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: "40px",
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          padding: "20px 40px",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0" }}>
            Stationery Management System • Last updated:{" "}
            {new Date().toLocaleDateString()}
          </p>
          <p style={{ margin: "5px 0 0", fontSize: "12px" }}>
            Total Items: {items.length} • Active Requests:{" "}
            {usage.filter((u) => u.status === "pending").length}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StationeryDashboard;
