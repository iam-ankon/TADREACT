// src/components/lab_qc/LabFactoryAssignments.jsx
//
// Admin-only: maps which QC officer is assigned to which factory(s).

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  getFactoryAssignments,
  createFactoryAssignment,
  deleteFactoryAssignment,
  getQcUsers,
  getFactories,
  isLabAdmin,
} from "../../api/labQc";
import {
  LabPageLayout,
  LoadingState,
  AccessDenied,
  PageHeader,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  dangerButtonStyle,
  formatDateTime,
  COLORS,
} from "./common";

const LabFactoryAssignments = () => {
  const admin = isLabAdmin();

  const [assignments, setAssignments] = useState([]);
  const [qcUsers, setQcUsers] = useState([]);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newQcUser, setNewQcUser] = useState("");
  const [newFactory, setNewFactory] = useState("");

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([getFactoryAssignments(), getQcUsers(), getFactories()])
      .then(([a, u, f]) => {
        setAssignments(a.data?.results || a.data || []);
        setQcUsers(u.data || []);
        setFactories(f.data || []);
      })
      .catch(() => toast.error("Failed to load factory assignments."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (admin) fetchAll();
    else setLoading(false);
  }, [admin, fetchAll]);

  if (!admin) {
    return (
      <LabPageLayout skipAccessCheck>
        <AccessDenied message="Factory assignments are managed by Lab admins only." />
      </LabPageLayout>
    );
  }

  const handleAdd = async () => {
    if (!newQcUser || !newFactory) {
      toast.error("Select both a QC officer and a factory.");
      return;
    }
    setSaving(true);
    try {
      await createFactoryAssignment({ qc_user: Number(newQcUser), factory: Number(newFactory) });
      toast.success("Assignment added.");
      setNewQcUser("");
      setNewFactory("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignment) => {
    if (!window.confirm(`Remove ${assignment.qc_user_name} from ${assignment.factory_name}?`)) return;
    try {
      await deleteFactoryAssignment(assignment.id);
      toast.success("Assignment removed.");
      fetchAll();
    } catch {
      toast.error("Failed to remove assignment.");
    }
  };

  return (
    <LabPageLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <PageHeader
          title="QC ↔ Factory Assignments"
          subtitle="Controls which QC officer can create reports for which factory, and drives the dashboard's factory-wise grouping."
        />

        <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Add Assignment</h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={labelStyle}>QC Officer</div>
              <select value={newQcUser} onChange={(e) => setNewQcUser(e.target.value)} style={inputStyle}>
                <option value="">Select QC officer...</option>
                {qcUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.username}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={labelStyle}>Factory</div>
              <select value={newFactory} onChange={(e) => setNewFactory(e.target.value)} style={inputStyle}>
                <option value="">Select factory...</option>
                {factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.supplier_name} {f.location_factory ? `(${f.location_factory})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button style={primaryButtonStyle} onClick={handleAdd} disabled={saving}>
              <FiPlus style={{ marginRight: 6, verticalAlign: "middle" }} />
              {saving ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {loading ? (
            <LoadingState label="Loading assignments..." />
          ) : assignments.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: COLORS.textMuted }}>
              No factory assignments yet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  {["QC Officer", "Factory", "Assigned On", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", color: COLORS.textMuted, fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{a.qc_user_name}</td>
                    <td style={{ padding: "12px 16px" }}>{a.factory_name}</td>
                    <td style={{ padding: "12px 16px" }}>{formatDateTime(a.created_at)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button onClick={() => handleRemove(a)} style={dangerButtonStyle}>
                        <FiTrash2 style={{ marginRight: 4, verticalAlign: "middle" }} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </LabPageLayout>
  );
};

export default LabFactoryAssignments;
