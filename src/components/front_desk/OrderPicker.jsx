// Small order-number search box used as a custom field in CrudTable
// (courier + sample-movement forms link to an Order by id).
import React, { useState } from "react";
import { getOrders } from "../../api/merchandiser";
import { styles } from "./frontDeskTheme";

const OrderPicker = ({ value, onChange }) => {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  const search = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setOptions([]);
      return;
    }
    getOrders(1, 10, { filters: { search: text } })
      .then((res) => setOptions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOptions([]));
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        style={styles.input}
        placeholder="Search Order NO / PO..."
        value={query}
        onChange={(e) => search(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {value && !query && (
        <div style={{ fontSize: "12px", color: "#4f46e5", marginTop: "3px" }}>
          Linked: Order #{value}
        </div>
      )}
      {open && options.length > 0 && (
        <div style={{ position: "absolute", zIndex: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", width: "100%", maxHeight: "180px", overflowY: "auto", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
          {options.map((o) => (
            <div
              key={o.id}
              style={{ padding: "8px 10px", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
              onMouseDown={() => {
                onChange(o.id);
                setQuery(o.style || o.po_no || `Order #${o.id}`);
                setOpen(false);
              }}
            >
              {o.style || "—"} · PO {o.po_no || "—"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderPicker;
