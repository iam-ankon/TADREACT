import React from "react";
import { meetingRoomsApi } from "../../api/frontDeskApi";
import CrudTable, { statusBadge } from "./CrudTable";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const columns = [
  { key: "meeting_date", label: "Date", render: (r) => fmtDate(r.meeting_date) },
  { key: "time_slot", label: "Time Slot" },
  { key: "requested_by_name", label: "Requested By" },
  { key: "department_team", label: "Department / Team" },
  { key: "purpose", label: "Purpose" },
  { key: "person_count", label: "Persons" },
  { key: "duration", label: "Duration" },
  { key: "assigned_room", label: "Assigned Room" },
  { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
];

const fields = [
  { name: "requested_by_name", label: "Requested By" },
  { name: "requested_by_email", label: "Email" },
  { name: "department_team", label: "Department / Team" },
  { name: "meeting_date", label: "Meeting Date", type: "date" },
  { name: "time_slot", label: "Time Slot (e.g. 11:30 AM)" },
  { name: "duration", label: "Duration (e.g. 60 Min / Half Day)" },
  { name: "room_preference", label: "Room Preference" },
  { name: "assigned_room", label: "Assigned Room" },
  { name: "person_count", label: "Person Count", type: "number" },
  { name: "purpose", label: "Purpose" },
  { name: "approver", label: "Approver" },
  { name: "status", label: "Status", type: "select", options: ["Pending", "Confirmed", "Cancelled"] },
  { name: "remarks", label: "Remarks", type: "textarea", span: "full" },
];

const MeetingRoomPage = () => (
  <CrudTable
    title="Meeting Room Booking"
    subtitle="Room requests and confirmations"
    columns={columns}
    fields={fields}
    api={meetingRoomsApi}
    emptyLabel="No bookings yet"
  />
);

export default MeetingRoomPage;
