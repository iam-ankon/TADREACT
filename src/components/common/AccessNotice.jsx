// Small notice shown after ProtectedRoute sends a user back to their home
// page because they opened a page they don't have access to.
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const AccessNotice = () => {
  const location = useLocation();
  const [blocked, setBlocked] = useState(null);

  useEffect(() => {
    const path = location.state?.accessDenied;
    if (!path) return undefined;
    setBlocked(path);
    const t = setTimeout(() => setBlocked(null), 6000);
    return () => clearTimeout(t);
  }, [location.key, location.state]);

  if (!blocked) return null;
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: "min(560px, calc(100vw - 32px))",
        padding: "11px 14px 11px 16px",
        background: "#fff",
        border: "1px solid #fecaca",
        borderLeft: "4px solid #b91c1c",
        borderRadius: 12,
        boxShadow: "0 16px 32px -12px rgba(15,23,42,.35)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        fontSize: 13.5,
        color: "#334155",
      }}
    >
      <span>
        <b style={{ color: "#0f172a" }}>You don't have access to that page.</b> You've been taken to your home page.
      </span>
      <button
        type="button"
        onClick={() => setBlocked(null)}
        aria-label="Dismiss"
        style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
};

export default AccessNotice;
