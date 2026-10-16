import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTruck, FiPackage, FiInbox, FiUsers, FiCalendar } from "react-icons/fi";
import { couriersApi, sampleMovementsApi, vendorReceiptsApi, visitorsApi, meetingRoomsApi } from "../../api/frontDeskApi";
import { styles } from "./frontDeskTheme";

const CARDS = [
  { key: "couriers", label: "Courier Shipments", icon: <FiTruck size={22} />, to: "/front-desk/couriers", api: couriersApi, accent: "#4f46e5" },
  { key: "samples", label: "Sample Movements", icon: <FiPackage size={22} />, to: "/front-desk/sample-routing", api: sampleMovementsApi, accent: "#0ea5e9" },
  { key: "receipts", label: "Vendor Receipts", icon: <FiInbox size={22} />, to: "/front-desk/vendor-receipts", api: vendorReceiptsApi, accent: "#16a34a" },
  { key: "visitors", label: "Visitors", icon: <FiUsers size={22} />, to: "/front-desk/visitors", api: visitorsApi, accent: "#d97706" },
  { key: "rooms", label: "Room Bookings", icon: <FiCalendar size={22} />, to: "/front-desk/meeting-rooms", api: meetingRoomsApi, accent: "#dc2626" },
];

const FrontDeskDashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    CARDS.forEach((c) => {
      c.api
        .list()
        .then((res) => {
          const rows = res.data?.results || res.data || [];
          setCounts((prev) => ({ ...prev, [c.key]: rows.length }));
        })
        .catch(() => {});
    });
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Front Desk</h1>
          <p style={styles.subtitle}>Courier tracking, sample routing, vendor receipts, visitors and room bookings</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {CARDS.map((c) => (
          <div
            key={c.key}
            style={{ ...styles.card, padding: "20px", cursor: "pointer" }}
            onClick={() => navigate(c.to)}
          >
            <div style={{ color: c.accent, marginBottom: "10px" }}>{c.icon}</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a" }}>
              {counts[c.key] ?? "—"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrontDeskDashboard;
