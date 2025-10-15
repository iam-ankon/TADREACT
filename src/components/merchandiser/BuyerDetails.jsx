import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { User, Mail, Phone, Grid, Tag, ArrowLeft } from "lucide-react";

export default function BuyerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyerCustomers, setBuyerCustomers] = useState([]);

  useEffect(() => {
    const fetchBuyerData = async () => {
      try {
        setLoading(true);

        // Fetch buyer details
        const buyerResponse = await axios.get(
          `http://119.148.51.38:8000/api/merchandiser/api/buyer/${id}/`
        );

        setBuyer(buyerResponse.data);

        // Fetch all customers to find those associated with this buyer
        const customersResponse = await axios.get(
          "http://119.148.51.38:8000/api/merchandiser/api/customer/"
        );

        // Filter customers that are associated with this buyer
        const associatedCustomers = customersResponse.data.filter((customer) =>
          buyerResponse.data.customers.includes(customer.id)
        );

        setBuyerCustomers(associatedCustomers);
      } catch (err) {
        console.error("Error fetching buyer data:", err);
        setError("Failed to load buyer details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <p>Loading buyer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <p>No buyer found.</p>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", height: "100vh", backgroundColor: "#A7D5E1" }}
    >
      <Sidebar />
      <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Buyer Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={32} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>
                {buyer.name}
              </h2>
              <p style={{ margin: 0, color: "#6b7280" }}>
                {buyer.position || "No position"}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              Contact Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={18} style={{ color: "#2563eb" }} />
                <a
                  href={`mailto:${buyer.email}`}
                  style={{ color: "#2563eb", textDecoration: "none" }}
                >
                  {buyer.email}
                </a>
              </div>
              {buyer.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={18} style={{ color: "#2563eb" }} />
                  <span>{buyer.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              Details
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {buyer.department && (
                <span
                  style={{
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  Department: {buyer.department}
                </span>
              )}
              {buyer.wgr && (
                <span
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  <Tag size={16} style={{ marginRight: 6 }} />
                  WGR: {buyer.wgr}
                </span>
              )}
              {buyer.product_categories && (
                <span
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  <Grid size={16} style={{ marginRight: 6 }} />
                  {buyer.product_categories}
                </span>
              )}
            </div>
          </div>

          {buyerCustomers.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                Associated Customers ({buyerCustomers.length})
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {buyerCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    style={{
                      padding: "12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: 6,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {customer.name}
                    </div>
                    {customer.email && (
                      <div style={{ fontSize: 14, color: "#6b7280" }}>
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div style={{ fontSize: 14, color: "#6b7280" }}>
                        {customer.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {buyer.remarks && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Remarks
              </h3>
              <p style={{ color: "#374151" }}>{buyer.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
