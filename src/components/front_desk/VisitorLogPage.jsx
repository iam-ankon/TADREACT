import React from "react";
import { visitorsApi } from "../../api/frontDeskApi";
import CrudTable, { statusBadge } from "./CrudTable";

const fmtTime = (d) => (d ? new Date(d).toLocaleString() : "—");

const columns = [
  { key: "created_at", label: "Visit Time", render: (r) => fmtTime(r.created_at) },
  { key: "visitor_type", label: "Type", render: (r) => statusBadge(r.visitor_type) },
  { key: "full_name", label: "Full Name" },
  { key: "mobile_number", label: "Mobile" },
  { key: "where_from", label: "Where From" },
  { key: "to_whom", label: "Visiting" },
  { key: "total_visitors", label: "Total" },
  { key: "created_by", label: "Logged By" },
];

const fields = [
  { name: "visitor_type", label: "Visitor Type", type: "select", options: ["Guest", "Host"] },
  { name: "full_name", label: "Full Name" },
  { name: "mobile_number", label: "Mobile Number" },
  { name: "where_from", label: "Where From" },
  { name: "to_whom", label: "Visiting (Employee)" },
  { name: "total_visitors", label: "Total Visitors", type: "number" },
  { name: "guest_names", label: "Other Guests' Names", span: "full" },
  { name: "remarks", label: "Remarks", type: "textarea", span: "full" },
];

const VisitorLogPage = () => (
  <CrudTable
    title="Visitor Log"
    subtitle="Front-desk guest register"
    columns={columns}
    fields={fields}
    api={visitorsApi}
    emptyLabel="No visitors logged yet"
  />
);

export default VisitorLogPage;
