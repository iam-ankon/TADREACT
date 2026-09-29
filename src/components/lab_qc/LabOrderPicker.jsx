// src/components/lab_qc/LabOrderPicker.jsx
//
// Debounced search-as-you-type dropdown against /orders-lite/ - the only
// order endpoint this module is ever allowed to call (never
// /api/merchandiser/api/orders/, which carries pricing).

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { getOrdersLite } from "../../api/labQc";
import { inputStyle, COLORS, formatDate } from "./common";

const LabOrderPicker = ({ onSelect, disabled }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const runSearch = useCallback((term) => {
    setLoading(true);
    getOrdersLite({ search: term, page: 1 })
      .then((res) => {
        setResults(res.data?.results || []);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (order) => {
    onSelect(order);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <FiSearch
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: COLORS.textMuted,
          }}
        />
        <input
          type="text"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by Order NO, PO No, or Buyer..."
          style={{ ...inputStyle, paddingLeft: 36, paddingRight: query ? 36 : 12 }}
        />
        {query && (
          <FiX
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: COLORS.textMuted,
              cursor: "pointer",
            }}
          />
        )}
      </div>

      {open && query.trim() && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "white",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div style={{ padding: "12px 16px", color: COLORS.textMuted, fontSize: "0.85rem" }}>
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: "12px 16px", color: COLORS.textMuted, fontSize: "0.85rem" }}>
              No matching orders found.
            </div>
          )}
          {!loading &&
            results.map((order) => (
              <div
                key={order.id}
                onClick={() => handlePick(order)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <div style={{ fontWeight: 600, color: COLORS.text, fontSize: "0.9rem" }}>
                  {order.order_no}{" "}
                  <span style={{ fontWeight: 400, color: COLORS.textMuted }}>
                    - {order.buyer || "-"}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: COLORS.textMuted }}>
                  Order NO: {order.style || "-"} &nbsp;|&nbsp; Factory: {order.factory_name || "-"}{" "}
                  &nbsp;|&nbsp; Order Date: {formatDate(order.order_date)}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LabOrderPicker;
