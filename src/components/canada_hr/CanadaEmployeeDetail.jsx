import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiAlertCircle, FiUser,
  FiMapPin, FiBriefcase, FiDollarSign, FiCalendar, FiShield,
} from "react-icons/fi";
import {
  getCanadaEmployee, deleteCanadaEmployee,
  getEmployeePayrollSummary, getEmployeeLeaveBalance,
} from "../../api/canadaApi";

const STATUS_COLORS = {
  active:      { bg: "#ECFDF5", color: "#065F46" },
  on_leave:    { bg: "#FFFBEB", color: "#92400E" },
  probation:   { bg: "#EEF2FF", color: "#1E40AF" },
  notice:      { bg: "#FEF3C7", color: "#92400E" },
  terminated:  { bg: "#FEF2F2", color: "#991B1B" },
};

const fmtCAD = (v) =>
  v == null ? "—" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD",
    maximumFractionDigits: 0 }).format(v);

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      background: s.bg, color: s.color, padding: "3px 10px",
      borderRadius: 10, fontSize: 11.5, fontWeight: 500, textTransform: "capitalize",
    }}>
      {status?.replace("_", " ")}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #F1F5F9" }}>
      <span style={{ fontSize: 12, color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "#0F172A", fontWeight: 500 }}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function CanadaEmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [emp, setEmp] = useState(null);
  const [payroll, setPayroll] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, payRes, leaveRes] = await Promise.all([
        getCanadaEmployee(id),
        getEmployeePayrollSummary(id).catch(() => ({ data: [] })),
        getEmployeeLeaveBalance(id).catch(() => ({ data: null })),
      ]);
      setEmp(empRes.data);
      setPayroll(Array.isArray(payRes.data) ? payRes.data : []);
      setLeaveBalance(leaveRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await deleteCanadaEmployee(id);
      navigate("/canada/employees");
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>Loading…</div>;
  }

  if (error || !emp) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{
          background: "#FEF2F2", border: "0.5px solid #FECACA", borderRadius: 8,
          padding: "12px 16px", color: "#991B1B", fontSize: 12.5, display: "flex", gap: 8,
        }}>
          <FiAlertCircle /> {error || "Employee not found"}
        </div>
      </div>
    );
  }

  const person = emp.employee_data || {};
  const initials = person.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <button
        onClick={() => navigate("/canada/employees")}
        style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
          background: "none", border: "none", color: "#64748B",
          fontSize: 12.5, cursor: "pointer", padding: 0,
        }}
      >
        <FiArrowLeft /> Back to employees
      </button>

      {/* Header card */}
      <div style={{
        background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12,
        padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 16,
      }}>
        {person.image1 ? (
          <img src={person.image1} alt={person.name}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#1B4FD8,#818CF8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 20, fontWeight: 600, flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 17, fontWeight: 500, color: "#0F172A" }}>{person.name}</span>
            <StatusBadge status={emp.status} />
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B" }}>
            {person.designation} · {person.employee_id}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{person.email}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/canada/employees/${id}/edit`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", border: "0.5px solid #CBD5E1",
              borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#475569",
            }}
          >
            <FiEdit2 /> Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", border: "0.5px solid #FECACA",
              borderRadius: 8, background: "#FEF2F2", color: "#991B1B", cursor: "pointer", fontSize: 12.5,
            }}
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Section icon={<FiMapPin style={{ color: "#1B4FD8" }} />} title="Employment details">
          <InfoRow label="Province" value={emp.province} />
          <InfoRow label="Employment type" value={emp.employment_type?.replace("_", "-")} />
          <InfoRow label="Office location" value={emp.office_location} />
          <InfoRow label="Vacation entitlement" value={emp.vacation_entitlement_weeks ? `${emp.vacation_entitlement_weeks} weeks` : "—"} />
          <InfoRow label="Probation end date" value={emp.probation_end_date} />
          <InfoRow label="Joining date" value={person.joining_date} />
        </Section>

        <Section icon={<FiDollarSign style={{ color: "#10B981" }} />} title="Compensation">
          <InfoRow label="Annual salary" value={fmtCAD(emp.annual_salary_cad)} />
          <InfoRow label="Hourly rate" value={emp.hourly_rate ? fmtCAD(emp.hourly_rate) : "—"} />
          <InfoRow label="Pay frequency" value={emp.pay_frequency?.replace("_", "-")} />
        </Section>

        <Section icon={<FiShield style={{ color: "#8B5CF6" }} />} title="Compliance">
          <InfoRow label="SIN number" value={emp.sin_number ? "•••" + emp.sin_number.slice(-3) : "—"} />
          <InfoRow label="Work permit number" value={emp.work_permit_number} />
          <InfoRow label="Work permit expiry" value={emp.work_permit_expiry} />
        </Section>

        <Section icon={<FiCalendar style={{ color: "#F59E0B" }} />} title="Leave balance (this year)">
          {leaveBalance?.leave_balance ? (
            Object.entries(leaveBalance.leave_balance).map(([type, days]) => (
              <InfoRow key={type} label={type.replace(/_/g, " ")} value={`${days} days remaining`} />
            ))
          ) : (
            <div style={{ fontSize: 12, color: "#94A3B8", padding: "8px 0" }}>No leave data yet.</div>
          )}
        </Section>
      </div>

      <Section icon={<FiBriefcase style={{ color: "#1B4FD8" }} />} title="Recent payroll history">
        {payroll.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94A3B8", padding: "8px 0" }}>No payroll records yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {["Period","Gross","Net pay","Status"].map((h) => (
                  <th key={h} style={{
                    textAlign: h === "Period" ? "left" : "right", padding: "6px 8px",
                    color: "#94A3B8", fontWeight: 500, fontSize: 10.5,
                    borderBottom: "0.5px solid #E2E8F0", textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payroll.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "7px 8px" }}>{p.pay_period_month}/{p.pay_period_year}</td>
                  <td style={{ padding: "7px 8px", textAlign: "right" }}>{fmtCAD(p.gross_salary)}</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", color: "#10B981", fontWeight: 500 }}>{fmtCAD(p.net_pay)}</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", textTransform: "capitalize", color: "#64748B" }}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setDeleteConfirm(false)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", maxWidth: 380, width: "90%" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", color: "#0F172A", fontSize: 16 }}>Delete employee?</h3>
            <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: 13 }}>
              This will remove <strong>{person.name}</strong>'s Canada profile. Their base TAD employee record will not be deleted.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(false)} style={{
                flex: 1, padding: "8px 0", border: "0.5px solid #CBD5E1",
                borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, color: "#475569",
              }}>Cancel</button>
              <button onClick={handleDelete} style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
                background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
