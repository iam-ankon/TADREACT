// 404 page for URLs that don't exist in the app (before, they rendered an
// empty screen). Logged-in users get a button back to their home page.
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { homePath } from "../../utils/routeAccess";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = !!(localStorage.getItem("token") || sessionStorage.getItem("token"));

  return (
    <div
      style={{
        flex: 1,
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f5f9",
        padding: 24,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          background: "#fff",
          border: "1px solid #e6eaf0",
          borderRadius: 16,
          padding: "36px 28px",
          boxShadow: "0 1px 2px rgba(15,23,42,.04)",
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-.04em", color: "#2563eb", lineHeight: 1 }}>404</div>
        <h1 style={{ margin: "14px 0 6px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Page not found</h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.55 }}>
          There's no page at <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 6 }}>{location.pathname}</code>.
          It may have been moved, or the address was typed incorrectly.
        </p>
        <button
          type="button"
          onClick={() => navigate(loggedIn ? homePath() : "/", { replace: true })}
          style={{
            marginTop: 22,
            height: 40,
            padding: "0 18px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {loggedIn ? "Go to my home page" : "Go to login"}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
