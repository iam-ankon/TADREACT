import React from "react";
import { couriersApi } from "../../api/frontDeskApi";
import CrudTable, { statusBadge } from "./CrudTable";
import OrderPicker from "./OrderPicker";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const columns = [
  { key: "booking_date", label: "Booking Date", render: (r) => fmtDate(r.booking_date) },
  { key: "tracking_no", label: "AWB / Tracking No" },
  { key: "direction", label: "Direction", render: (r) => statusBadge(r.direction) },
  { key: "sender", label: "Sender" },
  { key: "receiver", label: "Receiver" },
  { key: "courier_name", label: "Courier" },
  { key: "weight_kg", label: "Weight (kg)" },
  { key: "order_display", label: "Order" },
  { key: "delivered_date", label: "Delivered", render: (r) => fmtDate(r.delivered_date) },
  {
    key: "invoice_matched",
    label: "Invoice Matched",
    render: (r) => (r.invoice_matched ? statusBadge("Confirmed") : "—"),
  },
  { key: "created_by", label: "Logged By" },
];

const fields = [
  { name: "booking_date", label: "Booking Date", type: "date" },
  { name: "tracking_no", label: "AWB / Tracking No" },
  { name: "direction", label: "Direction", type: "select", options: ["Export", "Import"] },
  { name: "sender", label: "Sender" },
  { name: "receiver", label: "Receiver" },
  { name: "courier_name", label: "Courier (DHL / FedEx / UPS...)" },
  { name: "buyer", label: "Buyer" },
  { name: "weight_kg", label: "Weight (kg)", type: "number" },
  { name: "courier_cost", label: "Courier Cost" },
  { name: "delivered_date", label: "Delivered Date", type: "date" },
  { name: "order", label: "Link to Order", Component: OrderPicker, span: "full" },
  { name: "invoice_ref", label: "Courier Invoice Ref" },
  { name: "invoice_matched", label: "Matched to Billed Invoice", type: "checkbox" },
  { name: "remarks", label: "Remarks", type: "textarea", span: "full" },
];

const CourierPage = () => (
  <CrudTable
    title="Courier Tracking"
    subtitle="Outgoing / incoming international parcels (AWB log)"
    columns={columns}
    fields={fields}
    api={couriersApi}
    emptyLabel="No courier shipments logged yet"
  />
);

export default CourierPage;
