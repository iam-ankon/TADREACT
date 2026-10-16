import React from "react";
import { sampleMovementsApi } from "../../api/frontDeskApi";
import CrudTable, { statusBadge } from "./CrudTable";
import OrderPicker from "./OrderPicker";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const columns = [
  { key: "sent_date", label: "Sent Date", render: (r) => fmtDate(r.sent_date) },
  { key: "item_type", label: "Item" },
  { key: "sent_to", label: "Sent To (Factory / Institute)" },
  { key: "messenger", label: "Messenger / Handled By" },
  { key: "order_display", label: "Order" },
  { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
  { key: "result_received_date", label: "Result Received", render: (r) => fmtDate(r.result_received_date) },
  { key: "created_by", label: "Logged By" },
];

const fields = [
  { name: "sent_date", label: "Sent Date", type: "date" },
  {
    name: "item_type", label: "Item Type", type: "select",
    options: ["Swatch Card", "Trim Card", "Document", "Sample Packet", "Other"],
  },
  { name: "sent_to", label: "Sent To (Factory / TUV SUD / Institute)" },
  { name: "messenger", label: "Messenger / Handled By" },
  { name: "order", label: "Link to Order", Component: OrderPicker, span: "full" },
  {
    name: "status", label: "Status", type: "select",
    options: ["Sent", "Received", "Testing", "Completed", "Returned"],
  },
  { name: "result_received_date", label: "Result Received Date", type: "date" },
  { name: "remarks", label: "Remarks", type: "textarea", span: "full" },
];

const SampleRoutingPage = () => (
  <CrudTable
    title="Sample / Testing Routing"
    subtitle="Swatch, trim and sample packets sent to factories or testing institutes (e.g. TUV SUD)"
    columns={columns}
    fields={fields}
    api={sampleMovementsApi}
    emptyLabel="No sample movements logged yet"
  />
);

export default SampleRoutingPage;
