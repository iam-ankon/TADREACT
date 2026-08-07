// src/components/TNAReminderBadge.jsx
// FIXED: Shows latest count with pulse animation

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import TNAReminders from "./TNAReminders";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const api = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Inject pulse animation once at module load
if (typeof document !== "undefined") {
  const id = "__tna-badge-pulse__";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes tna-pulse {
        0%   { transform: scale(1);   opacity: 1; }
        50%  { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes tna-bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(s);
  }
}

export default function TNAReminderBadge() {
  const [count, setCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const response = await api.get("tna/reminders/count/", {
        signal: abortRef.current.signal,
      });
      const total = response.data.total ?? 0;
      const urgent = response.data.urgent ?? 0;
      setCount(total);
      setUrgentCount(urgent);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.warn("TNA count fetch failed:", err.message);
      }
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60 * 1000);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchCount]);

  const handleReminderClick = (tnaId) => {
    setShowDropdown(false);
    window.location.href = `/tna-details/${tnaId}`;
  };

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.badgeButton,
          ...(urgentCount > 0 ? styles.badgeUrgent : {}),
        }}
        onClick={() => setShowDropdown((v) => !v)}
        title={`${count} TNA reminder${count !== 1 ? "s" : ""}`}
      >
        <FaBell size={18} />
        {count > 0 && (
          <span style={styles.countBadge}>{count > 99 ? "99+" : count}</span>
        )}
        {urgentCount > 0 && <span style={styles.pulseDot} />}
      </button>

      {showDropdown && (
        <>
          <div style={styles.overlay} onClick={() => setShowDropdown(false)} />
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <span style={styles.dropdownTitle}>
                TNA Reminders
                {count > 0 && (
                  <span style={styles.dropdownBadge}>{count} total</span>
                )}
              </span>
              <button
                style={styles.closeBtn}
                onClick={() => setShowDropdown(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.dropdownBody}>
              <TNAReminders
                onReminderClick={handleReminderClick}
                autoFetch={true}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { position: "relative", display: "inline-block" },
  badgeButton: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#475569",
  },
  badgeUrgent: {
    borderColor: "#dc2626",
    color: "#dc2626",
    animation: "tna-pulse 2s infinite",
  },
  countBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#dc2626",
    color: "white",
    fontSize: "10px",
    fontWeight: "700",
    padding: "1px 5px",
    borderRadius: "50%",
    minWidth: "18px",
    textAlign: "center",
  },
  pulseDot: {
    position: "absolute",
    top: "2px",
    right: "2px",
    width: "10px",
    height: "10px",
    background: "#dc2626",
    borderRadius: "50%",
    animation: "tna-pulse 1.5s infinite",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: "450px",
    maxWidth: "calc(100vw - 32px)",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 1001,
    overflow: "hidden",
  },
  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  dropdownTitle: { 
    fontSize: "14px", 
    fontWeight: "600", 
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdownBadge: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "1px 10px",
    borderRadius: "12px",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  dropdownBody: { maxHeight: "500px", overflowY: "auto" },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
};