import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
  Users,
} from "lucide-react";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "http://119.148.51.38:8000/api/merchandiser/api/customer/";
  const BUYER_URL = "http://119.148.51.38:8000/api/merchandiser/api/buyer/";

  useEffect(() => {
    async function fetchData() {
      try {
        const [customerRes, buyersRes] = await Promise.all([
          axios.get(`${API_URL}${id}/`),
          axios.get(BUYER_URL),
        ]);
        setCustomer(customerRes.data);
        setBuyers(buyersRes.data);
      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", height: "100vh", backgroundColor: "#A7D5E1" }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p>Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          backgroundColor: "#A7D5E1",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p>Customer not found</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginLeft: 12,
              padding: "6px 12px",
              backgroundColor: "#e2e8f0",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            ⬅ Back
          </button>
        </div>
      </div>
    );
  }

  const customerBuyers =
    customer.buyer?.map((bid) => buyers.find((b) => b.id === bid)?.name) || [];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#A7D5E1",
      }}
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

        {/* Customer Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
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
                {customer.name}
              </h2>
              <p style={{ margin: 0, color: "#6b7280" }}>
                {customerBuyers.length > 0 ? customerBuyers[0] : ""}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              Contact Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {customer.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} style={{ color: "#2563eb" }} />
                  <a
                    href={`mailto:${customer.email}`}
                    style={{ color: "#2563eb", textDecoration: "none" }}
                  >
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={18} style={{ color: "#2563eb" }} />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={18} style={{ color: "#2563eb" }} />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Extra Info */}
          {customer.remarks && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Remarks
              </h3>
              <p style={{ color: "#374151" }}>{customer.remarks}</p>
            </div>
          )}

          {/* Buyers List */}
          {customerBuyers.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                All Buyers ({customerBuyers.length})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {customerBuyers.map((buyer, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: "#f3f4f6",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Users size={16} style={{ color: "#2563eb" }} />
                    {buyer}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              onClick={() => navigate(`/edit-customer/${customer.id}`)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
