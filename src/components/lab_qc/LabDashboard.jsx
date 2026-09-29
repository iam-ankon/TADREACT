// src/components/lab_qc/LabDashboard.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiClipboard, FiCheckCircle, FiXCircle, FiAlertTriangle, FiEdit3, FiFileText } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getLabDashboard, getFactories, getQcUsers, isLabAdmin } from "../../api/labQc";
import {
  LabPageLayout,
  LoadingState,
  StatCard,
  PageHeader,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  COLORS,
} from "./common";

const LabDashboard = () => {
  const navigate = useNavigate();
  const admin = isLabAdmin();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [factory, setFactory] = useState("");
  const [month, setMonth] = useState("");
  const [qcUser, setQcUser] = useState("");

  const [factoryOptions, setFactoryOptions] = useState([]);
  const [qcUserOptions, setQcUserOptions] = useState([]);

  useEffect(() => {
    // Every Lab/QC user (not just admins) needs the full factory list for
    // the "Factory" filter - it's just id+name, nothing sensitive, and
    // deriving it from her own report history instead would leave the
    // dropdown empty until she's submitted at least one report.
    getFactories()
      .then((res) => setFactoryOptions(res.data || []))
      .catch(() => {});
    if (admin) {
      getQcUsers()
        .then((res) => setQcUserOptions(res.data || []))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    const params = {};
    if (factory) params.factory = factory;
    if (month) params.month = month;
    if (admin && qcUser) params.qc_user = qcUser;

    getLabDashboard(params)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, [factory, month, qcUser, admin]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const derivedFactoryOptions = useMemo(
    () => factoryOptions.map((f) => ({ id: f.id, name: f.supplier_name })),
    [factoryOptions],
  );

  const summary = data?.summary || {
    total_reports: 0,
    passed: 0,
    failed: 0,
    conditional: 0,
    draft: 0,
  };

  return (
    <LabPageLayout>
      <div>
        <PageHeader
          title="Lab/QC Dashboard"
          subtitle="Only submitted reports count toward these statistics."
          actions={
            <button style={primaryButtonStyle} onClick={() => navigate("/lab-qc/reports")}>
              <FiFileText style={{ marginRight: 6, verticalAlign: "middle" }} />
              Reports
            </button>
          }
        />

        <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div>
              <div style={labelStyle}>Factory</div>
              <select value={factory} onChange={(e) => setFactory(e.target.value)} style={inputStyle}>
                <option value="">All Factories</option>
                {derivedFactoryOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Month</div>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
            </div>
            {admin && (
              <div>
                <div style={labelStyle}>QC Officer</div>
                <select value={qcUser} onChange={(e) => setQcUser(e.target.value)} style={inputStyle}>
                  <option value="">All QC Officers</option>
                  {qcUserOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name || u.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading dashboard..." />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <StatCard
                title="Total Reports"
                value={summary.total_reports}
                gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                icon={<FiClipboard size={22} />}
              />
              <StatCard
                title="Passed"
                value={summary.passed}
                gradient="linear-gradient(135deg, #10b981 0%, #047857 100%)"
                icon={<FiCheckCircle size={22} />}
              />
              <StatCard
                title="Failed"
                value={summary.failed}
                gradient="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                icon={<FiXCircle size={22} />}
              />
              <StatCard
                title="Conditional"
                value={summary.conditional}
                gradient="linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
                icon={<FiAlertTriangle size={22} />}
              />
              <StatCard
                title="Draft"
                value={summary.draft}
                gradient="linear-gradient(135deg, #94a3b8 0%, #475569 100%)"
                icon={<FiEdit3 size={22} />}
              />
            </div>

            <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Monthly Report Status</h3>
              {(data?.monthly || []).length === 0 ? (
                <div style={{ color: COLORS.textMuted, padding: "1rem 0" }}>No submitted reports yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="passed" name="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <h3 style={{ margin: 0, padding: "1.25rem 1.5rem 0.5rem", fontSize: "1rem" }}>Factory-wise Summary</h3>
              {(data?.factory_wise || []).length === 0 ? (
                <div style={{ padding: "2rem 1.5rem", color: COLORS.textMuted }}>No data for the current filters.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                        {["Factory", "Assigned QC", "Reports Done", "Pass", "Fail", "Pass Rate"].map((h) => (
                          <th key={h} style={{ padding: "12px 16px", color: COLORS.textMuted, fontWeight: 600 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.factory_wise.map((f) => (
                        <tr key={f.factory_id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: "12px 16px", fontWeight: 500 }}>{f.factory_name}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {(f.assigned_qc || []).length > 0 ? f.assigned_qc.join(", ") : "-"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>{f.reports_done}</td>
                          <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 600 }}>{f.passed}</td>
                          <td style={{ padding: "12px 16px", color: "#ef4444", fontWeight: 600 }}>{f.failed}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {f.pass_rate === null || f.pass_rate === undefined ? "-" : `${f.pass_rate}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </LabPageLayout>
  );
};

export default LabDashboard;
