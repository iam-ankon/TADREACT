import React from "react";
import { vendorReceiptsApi } from "../../api/frontDeskApi";
import CrudTable from "./CrudTable";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const columns = [
  { key: "received_date", label: "Rcv Date", render: (r) => fmtDate(r.received_date) },
  { key: "vendor", label: "Vendor" },
  { key: "buyer_dept", label: "Buyer / Dept" },
  { key: "order_no", label: "Order No(s)" },
  { key: "remarks", label: "Remarks" },
  { key: "created_by", label: "Logged By" },
];

const fields = [
  { name: "received_date", label: "Received Date", type: "date" },
  { name: "vendor", label: "Vendor" },
  { name: "buyer_dept", label: "Buyer / Department" },
  { name: "order_no", label: "Order No(s)" },
  { name: "remarks", label: "Remarks", type: "textarea", span: "full" },
];

const VendorReceiptPage = () => (
  <CrudTable
    title="Vendor Shipment Receipts"
    subtitle="Inbound fabric / trim / accessory shipments received from vendors"
    columns={columns}
    fields={fields}
    api={vendorReceiptsApi}
    emptyLabel="No vendor receipts logged yet"
  />
);

export default VendorReceiptPage;
