// HR department sidebar (used by the HR pages).
import React from "react";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSend,
  FiLogOut,
  FiBriefcase,
  FiClock,
  FiHome,
  FiTrendingUp,
} from "react-icons/fi";
import { TfiEmail, TfiWorld } from "react-icons/tfi";
import DeptSidebar from "../common/DeptSidebar";

const SECTIONS = [
  {
    label: "Overview",
    items: [{ to: "/hr-work", icon: <FiHome />, label: "Dashboard" }],
  },
  {
    label: "Recruitment",
    items: [
      { to: "/cv-list", icon: <FiFileText />, label: "All CV" },
      { to: "/interviews", icon: <FiBriefcase />, label: "Recruitment" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/employees", icon: <FiUsers />, label: "Employees" },
      { to: "/attendance", icon: <FiClock />, label: "Attendance" },
      { to: "/employee_leave", icon: <FiCalendar />, label: "Leave Management" },
      { to: "/performanse_appraisal", icon: <FiTrendingUp />, label: "Performance Appraisal" },
      { to: "/employee-termination", icon: <FiLogOut />, label: "Termination" },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/letter-send", icon: <FiSend />, label: "Send Letters" },
      { to: "/email-logs", icon: <TfiEmail />, label: "Email Log" },
    ],
  },
  {
    label: "Organization",
    items: [{ to: "/tad-groups", icon: <TfiWorld />, label: "TAD Groups" }],
  },
];

const Sidebars = () => (
  <DeptSidebar title="Human Resources" subtitle="TAD Group · HR" icon={<FiUsers />} sections={SECTIONS} />
);

export default Sidebars;
