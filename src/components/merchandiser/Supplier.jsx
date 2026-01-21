import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Status colors mapping
  const statusStyles = {
    active: { bg: "#d1fae5", text: "#065f46" },
    valid: { bg: "#d1fae5", text: "#065f46" },
    pending: { bg: "#fef3c7", text: "#92400e" },
    "in progress": { bg: "#fef3c7", text: "#92400e" },
    expired: { bg: "#fee2e2", text: "#b91c1c" },
    invalid: { bg: "#fee2e2", text: "#b91c1c" },
    cancelled: { bg: "#f3f4f6", text: "#374151" },
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://119.148.51.38:8000/api/merchandiser/api/supplier/"
        );
        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          setSuppliers(response.data);
        } else if (response.data && Array.isArray(response.data.results)) {
          // Handle paginated response
          setSuppliers(response.data.results);
        } else if (response.data && Array.isArray(response.data.data)) {
          // Handle nested data array
          setSuppliers(response.data.data);
        } else {
          console.error("Unexpected API response structure:", response.data);
          toast.error("Unexpected data format from server");
          setSuppliers([]);
        }
      } catch (error) {
        console.error("API Error:", error);
        toast.error("Failed to fetch suppliers");
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(
          `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/`
        );
        setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
        toast.success("Supplier deleted successfully");
      } catch (error) {
        console.error("Delete Error:", error);
        toast.error("Failed to delete supplier");
      }
    }
  };

  // Get effective status (similar to SupplierListCSR)
  const getEffectiveStatus = (supplier) => {
    return (
      supplier.bsci_status ||
      supplier.sedex_status ||
      supplier.agreement_status ||
      "unknown"
    ).toLowerCase();
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;

    const name = (supplier.supplier_name || supplier.name || "").toLowerCase();
    const vendorId = (supplier.supplier_id || supplier.vendor_id || "").toLowerCase();
    const email = (supplier.email || "").toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    return (
      name.includes(search) ||
      vendorId.includes(search) ||
      email.includes(search)
    );
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        overflowY: "auto",
        backgroundColor: "#A7D5E1",
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      <div
        style={{
          flexGrow: 1,
          padding: "2rem",
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
          }}
        >
          Supplier Management
        </h1>

        {/* Search + Add */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              width: "300px",
            }}
          />
          <button
            onClick={() => navigate("/add-supplier")}
            style={{
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            + Add Supplier
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            overflowX: "auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                {[
                  "Vendor ID",
                  "Name",
                  "Location",
                  "Category",
                  "Status",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {suppliers.length === 0 
                      ? "No suppliers found. The API might be returning empty data or wrong structure." 
                      : "No suppliers match your search"}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier, idx) => {
                  const status = getEffectiveStatus(supplier);
                  const statusStyle = statusStyles[status] || { bg: "#f3f4f6", text: "#374151" };
                  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                  return (
                    <tr
                      key={supplier.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "1rem", color: "#374151" }}>
                        {supplier.supplier_id || supplier.vendor_id || "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontWeight: "500",
                          color: "#2563eb",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/suppliers/${supplier.id}`)}
                      >
                        {supplier.supplier_name || supplier.name || "Unnamed Supplier"}
                      </td>
                      <td style={{ padding: "1rem", color: "#4b5563" }}>
                        {supplier.location || "—"}
                      </td>
                      <td style={{ padding: "1rem", color: "#4b5563" }}>
                        {supplier.supplier_category || supplier.vendor_type || "—"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.3rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <button
                          onClick={() =>
                            navigate(`/edit/suppliers/${supplier.id}`)
                          }
                          style={{
                            marginRight: "0.5rem",
                            color: "#2563eb",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          style={{
                            color: "#dc2626",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Supplier;