/**
 * CanadaApp.jsx
 * Root layout for the Canada Office HRMS.
 * Mount this at /canada/* in the main TAD App.jsx router.
 *
 * Usage in App.jsx:
 *   import CanadaApp from "./components/canada_hr/CanadaApp";
 *   <Route path="/canada/*" element={<CanadaApp />} />
 */
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import CanadaSidebar  from "./CanadaSidebar";
import CanadaDashboard from "./CanadaDashboard";
import CanadaEmployees from "./CanadaEmployees";
import CanadaEmployeeForm from "./CanadaEmployeeForm";
import CanadaEmployeeDetail from "./CanadaEmployeeDetail";
import CanadaLeave     from "./CanadaLeave";
import CanadaPayroll   from "./CanadaPayroll";
import CanadaAppraisals from "./CanadaAppraisals";
import CanadaRecruitment from "./CanadaRecruitment";
import CanadaHolidays  from "./CanadaHolidays";
import CanadaTax       from "./CanadaTax";
import CanadaPolicies  from "./CanadaPolicies";
import CanadaAttendance from "./CanadaAttendance";
import { getCanadaLeaves } from "../../api/canadaApi";

export default function CanadaApp() {
  const [pendingLeaves, setPendingLeaves] = useState(0);

  // Poll pending leave count for sidebar badge
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCanadaLeaves({ status: "pending" });
        const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        setPendingLeaves(data.length);
      } catch {
        // silently ignore badge errors
      }
    };
    fetch();
    const timer = setInterval(fetch, 60_000); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <CanadaSidebar pendingLeaves={pendingLeaves} />
      <div style={{
        flex: 1,
        overflow: "auto",
        background: "#F8FAFC",
        minWidth: 0,
      }}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"   element={<CanadaDashboard />} />
          <Route path="employees"           element={<CanadaEmployees />} />
          <Route path="employees/new"       element={<CanadaEmployeeForm />} />
          <Route path="employees/:id/edit"  element={<CanadaEmployeeForm />} />
          <Route path="employees/:id"       element={<CanadaEmployeeDetail />} />
          <Route path="attendance"  element={<CanadaAttendance />} />
          <Route path="leave"       element={<CanadaLeave />} />
          <Route path="appraisals"  element={<CanadaAppraisals />} />
          <Route path="recruitment" element={<CanadaRecruitment />} />
          <Route path="payroll"     element={<CanadaPayroll />} />
          <Route path="tax"         element={<CanadaTax />} />
          <Route path="policies"    element={<CanadaPolicies />} />
          <Route path="holidays"    element={<CanadaHolidays />} />
          <Route path="*"           element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
