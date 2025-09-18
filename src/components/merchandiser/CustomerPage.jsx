import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { User, Mail, Phone, MapPin, FileText, ArrowRight } from "lucide-react";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL = "http://119.148.12.1:8000/api/merchandiser/api/customer/";
  const BUYER_URL = "http://119.148.12.1:8000/api/merchandiser/api/buyer/";

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, buyerRes] = await Promise.all([
          axios.get(API_URL),
          axios.get(BUYER_URL),
        ]);
        setCustomers(custRes.data);
        setBuyers(buyerRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <p>Loading customers...</p>
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#A7D5E1" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: "bold" }}>Customer Management</h2>
          <button
            onClick={() => navigate("/add-customer")}
            style={{
              padding: "8px 14px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            ➕ Add Customer
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {customers.map((customer) => {
            const firstBuyerId = customer.buyer?.[0];
            const firstBuyer = buyers.find((b) => b.id === firstBuyerId);

            return (
              <div
                key={customer.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: "20px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      backgroundColor: "#dbeafe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={28} style={{ color: "#2563eb" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>
                      {customer.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
                      {firstBuyer ? firstBuyer.name : "No buyer"}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div style={{ marginTop: 16, fontSize: 14, color: "#374151" }}>
                  {customer.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Mail size={16} style={{ color: "#2563eb" }} />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Phone size={16} style={{ color: "#2563eb" }} />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <MapPin size={16} style={{ color: "#2563eb" }} />
                      <span>{customer.address}</span>
                    </div>
                  )}
                  {customer.remarks && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "#2563eb" }} />
                      <span>{customer.remarks}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <button
                    onClick={() => navigate(`/customer-details/${customer.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    View Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
