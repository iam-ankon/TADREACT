import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch, FiFilter, FiPlus, FiEye, FiEdit2, FiTrash2,
  FiRefreshCw, FiAlertCircle, FiUser, FiMapPin, FiBriefcase,
} from "react-icons/fi";
import { getCanadaEmployees, deleteCanadaEmployee, getBackendURL } from "../../api/canadaApi";

const STATUS_COLORS = {
  active:      { bg: "#ECFDF5", color: "#065F46" },
  on_leave:    { bg: "#FFFBEB", color: "#92400E" },
  probation:   { bg: "#EEF2FF", color: "#1E40AF" },
  notice:      { bg: "#FEF3C7", color: "#92400E" },
  terminated:  { bg: "#FEF2F2", color: "#991B1B" },
};

const EMP_GRADIENT = [
  "linear-gradient(135deg,#1B4FD8,#818CF8)",
  "linear-gradient(135deg,#10B981,#34D399)",
  "linear-gradient(135deg,#F59E0B,#FCD34D)",
  "linear-gradient(135deg,#8B5CF6,#A78BFA)",
  "linear-gradient(135deg,#EF4444,#F87171)",
  "linear-gradient(135deg,#C8102E,#F87171)",
];

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 8px", borderRadius: 10,
      fontSize: 10.5, fontWeight: 500, textTransform: "capitalize",
    }}>
      {status?.replace("_", " ")}
    </span>
  );
}

function EmpAvatar({ name, imageUrl, idx }) {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const bg = EMP_GRADIENT[idx % EMP_GRADIENT.length];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }

  return (
    <div style={{
      width: 42, height: 42, borderRadius: "50%",
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function CanadaEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.employment_type = typeFilter;
      if (deptFilter) params.department = deptFilter;
      const res = await getCanadaEmployees(params);
      const results = Array.isArray(res.data) ? res.data :
        (res.data?.results ?? []);
      setEmployees(results);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, deptFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleDelete = async (id) => {
    try {
      await deleteCanadaEmployee(id);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Employees</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
            {employees.length} employees · Canada Office
          </p>
        </div>
        <button
          onClick={() => navigate("/canada/employees/new")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", border: "none",
            borderRadius: 8, background: "#1B4FD8", color: "#fff",
            fontSize: 13, cursor: "pointer", fontWeight: 500,
          }}
        >
          <FiPlus /> Add employee
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "0.5px solid #CBD5E1",
          borderRadius: 8, padding: "0 10px", flex: "1 1 200px", minWidth: 0,
        }}>
          <FiSearch style={{ color: "#94A3B8", fontSize: 14, flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            style={{
              border: "none", background: "none", outline: "none",
              fontSize: 12.5, color: "#0F172A", padding: "7px 0", width: "100%",
            }}
          />
        </div>
        {[
          { label: "All status", value: statusFilter, set: setStatusFilter,
            options: [["active","Active"],["on_leave","On leave"],["probation","Probation"],["notice","Notice"],["terminated","Terminated"]] },
          { label: "All types", value: typeFilter, set: setTypeFilter,
            options: [["full_time","Full-time"],["part_time","Part-time"],["contract","Contract"],["intern","Intern"]] },
        ].map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
            style={{
              padding: "7px 10px", border: "0.5px solid #CBD5E1",
              borderRadius: 8, background: "#fff", fontSize: 12.5,
              color: "#475569", cursor: "pointer", outline: "none",
            }}
          >
            <option value="">{f.label}</option>
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", border: "0.5px solid #CBD5E1",
            borderRadius: 8, background: "#fff", fontSize: 12.5,
            cursor: "pointer", color: "#475569",
          }}
        >
          <FiRefreshCw style={{ fontSize: 13 }} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "0.5px solid #FECACA",
          borderRadius: 8, padding: "12px 16px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 8,
          color: "#991B1B", fontSize: 12.5,
        }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{
            width: 30, height: 30, border: "3px solid #E2E8F0",
            borderTopColor: "#1B4FD8", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Employee grid */}
      {!loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}>
          {employees.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px",
              color: "#94A3B8",
            }}>
              <FiUser style={{ fontSize: 40, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: "#64748B", marginBottom: 4 }}>
                No employees found
              </div>
              <div style={{ fontSize: 12.5 }}>
                {search || statusFilter || typeFilter
                  ? "Try adjusting your filters"
                  : "Add your first Canada office employee"}
              </div>
            </div>
          ) : (
            employees.map((emp, idx) => (
              <div
                key={emp.id}
                style={{
                  background: "#fff", border: "0.5px solid #E2E8F0",
                  borderRadius: 12, padding: 14, cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#4F78F1"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#E2E8F0"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <EmpAvatar name={emp.name} imageUrl={emp.image_url} idx={idx} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: "#0F172A",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{emp.designation}</div>
                  </div>
                  <StatusBadge status={emp.status} />
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: 4, marginBottom: 10,
                }}>
                  {[
                    { label: "ID", value: emp.employee_id },
                    { label: "Type", value: emp.employment_type?.replace("_", "-") },
                    { label: "Province", value: emp.province },
                    { label: "Location", value: emp.office_location || "—" },
                  ].map((item) => (
                    <div key={item.label} style={{ fontSize: 11, color: "#64748B" }}>
                      {item.label}:{" "}
                      <span style={{ color: "#0F172A", fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: "flex", gap: 6,
                  paddingTop: 10, borderTop: "0.5px solid #F1F5F9",
                }}>
                  {[
                    { icon: <FiEye />, label: "View", action: () => navigate(`/canada/employees/${emp.id}`) },
                    { icon: <FiEdit2 />, label: "Edit", action: () => navigate(`/canada/employees/${emp.id}/edit`) },
                    { icon: <FiTrash2 />, label: "Delete", action: () => setDeleteConfirm(emp), danger: true },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={(e) => { e.stopPropagation(); btn.action(); }}
                      style={{
                        flex: 1, display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 4,
                        padding: "5px 0", border: "0.5px solid #E2E8F0",
                        borderRadius: 6, background: "none",
                        fontSize: 11, cursor: "pointer",
                        color: btn.danger ? "#EF4444" : "#64748B",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      {btn.icon} {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12,
              padding: "24px 28px", maxWidth: 380, width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", color: "#0F172A", fontSize: 16 }}>Delete employee?</h3>
            <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: 13 }}>
              This will remove <strong>{deleteConfirm.name}</strong>'s Canada profile.
              Their base TAD employee record will not be deleted.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: "8px 0", border: "0.5px solid #CBD5E1",
                  borderRadius: 8, background: "#fff", cursor: "pointer",
                  fontSize: 13, color: "#475569",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{
                  flex: 1, padding: "8px 0", border: "none",
                  borderRadius: 8, background: "#EF4444", color: "#fff",
                  cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
