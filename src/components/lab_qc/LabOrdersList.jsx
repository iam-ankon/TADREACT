// src/components/lab_qc/LabOrdersList.jsx
//
// Read-only, pricing-free Orders view for the Lab/QC role. Deliberately
// calls only /orders-lite/ (never the main merchandiser Orders API, which
// returns every Order field including unit_price/total_value/commission -
// see src/api/labQc.js's warning comment). This is what the "Orders"
// button in the Lab/QC-narrowed merchandiser Sidebar points to.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { FiSearch } from "react-icons/fi";
import { getOrdersLite } from "../../api/labQc";
import {
  LabPageLayout,
  LoadingState,
  PageHeader,
  StatusBadge,
  cardStyle,
  inputStyle,
  labelStyle,
  secondaryButtonStyle,
  disabledButtonStyle,
  formatDate,
  COLORS,
} from "./common";

const PAGE_SIZE = 20;

const LabOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchDebounce = useRef(null);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput]);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;

    getOrdersLite(params)
      .then((res) => {
        setOrders(res.data?.results || []);
        setCount(res.data?.count || 0);
      })
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <LabPageLayout>
      <PageHeader title="Orders" subtitle={`${count} order(s) - basic information only, no pricing.`} />

      <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", maxWidth: 420 }}>
          <FiSearch
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Order NO, PO No, or Buyer..."
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState label="Loading orders..." />
        ) : orders.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: COLORS.textMuted }}>
            No orders found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  {["PO No", "Buyer", "Order NO", "Factory", "Order Date", "Production Start", "Shipment Date", "Status"].map(
                    (h) => (
                      <th key={h} style={{ padding: "10px 14px", color: COLORS.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{o.order_no}</td>
                    <td style={{ padding: "10px 14px" }}>{o.buyer || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>{o.style || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>{o.factory_name || "-"}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{formatDate(o.order_date)}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{formatDate(o.production_start_date)}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{formatDate(o.shipment_date)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
            <button
              style={page === 1 ? disabledButtonStyle : secondaryButtonStyle}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center", color: COLORS.textMuted, fontSize: "0.85rem" }}>
              Page {page} of {totalPages}
            </span>
            <button
              style={page === totalPages ? disabledButtonStyle : secondaryButtonStyle}
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </LabPageLayout>
  );
};

export default LabOrdersList;
