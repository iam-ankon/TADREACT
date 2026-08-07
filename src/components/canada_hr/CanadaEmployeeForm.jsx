import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSearch, FiUser, FiAlertCircle, FiCheck, FiArrowLeft } from "react-icons/fi";
import {
  getCanadaEmployee, createCanadaEmployee, updateCanadaEmployee, getCanadaEmployees,
} from "../../api/canadaApi";
import { getEmployees } from "../../api/employeeApi";

const PROVINCES = [
  ["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],
  ["NL","Newfoundland and Labrador"],["NS","Nova Scotia"],["NT","Northwest Territories"],
  ["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],
  ["SK","Saskatchewan"],["YT","Yukon"],
];

const EMPLOYMENT_TYPES = [
  ["full_time","Full-Time"],["part_time","Part-Time"],["contract","Contract"],["intern","Intern"],
];

const STATUSES = [
  ["active","Active"],["on_leave","On Leave"],["probation","Probation"],
  ["notice","Notice Period"],["terminated","Terminated"],
];

const PAY_FREQUENCIES = [
  ["weekly","Weekly"],["bi_weekly","Bi-Weekly"],["semi_monthly","Semi-Monthly"],["monthly","Monthly"],
];

const emptyForm = {
  employee: "",
  province: "ON",
  employment_type: "full_time",
  status: "active",
  sin_number: "",
  office_location: "",
  work_permit_number: "",
  work_permit_expiry: "",
  vacation_entitlement_weeks: 2,
  probation_end_date: "",
  hourly_rate: "",
  annual_salary_cad: "",
  pay_frequency: "bi_weekly",
  bank_transit_number: "",
  bank_institution_number: "",
  bank_account_number: "",
};

export default function CanadaEmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Employee picker (create mode only)
  const [pickedEmployee, setPickedEmployee] = useState(null); // { id, name, employee_id, designation, ... }
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [linkedIds, setLinkedIds] = useState(new Set()); // employee ids that already have a Canada profile

  // Load existing profile linked employee ids (to exclude from picker) + existing record if editing
  useEffect(() => {
    (async () => {
      try {
        const existingRes = await getCanadaEmployees();
        const existing = Array.isArray(existingRes.data) ? existingRes.data : (existingRes.data?.results ?? []);
        setLinkedIds(new Set(existing.map((e) => e.employee_pk)));
      } catch {
        // non-fatal — picker will just not exclude anyone
      }

      if (isEdit) {
        try {
          const res = await getCanadaEmployee(id);
          const d = res.data;
          setForm({
            employee: d.employee,
            province: d.province ?? "ON",
            employment_type: d.employment_type ?? "full_time",
            status: d.status ?? "active",
            sin_number: d.sin_number ?? "",
            office_location: d.office_location ?? "",
            work_permit_number: d.work_permit_number ?? "",
            work_permit_expiry: d.work_permit_expiry ?? "",
            vacation_entitlement_weeks: d.vacation_entitlement_weeks ?? 2,
            probation_end_date: d.probation_end_date ?? "",
            hourly_rate: d.hourly_rate ?? "",
            annual_salary_cad: d.annual_salary_cad ?? "",
            pay_frequency: d.pay_frequency ?? "bi_weekly",
            bank_transit_number: d.bank_transit_number ?? "",
            bank_institution_number: d.bank_institution_number ?? "",
            bank_account_number: d.bank_account_number ?? "",
          });
          setPickedEmployee({
            id: d.employee,
            name: d.employee_data?.name,
            employee_id: d.employee_data?.employee_id,
            designation: d.employee_data?.designation,
          });
        } catch (err) {
          setError(err.response?.data?.detail || err.message || "Failed to load employee");
        } finally {
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // Debounced search against the main TAD employee list
  useEffect(() => {
    if (isEdit) return;
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getEmployees(1, 15, { filters: { search: search.trim() } });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, isEdit]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!isEdit && !pickedEmployee) {
      setError("Please select a TAD employee to create a Canada profile for.");
      return;
    }

    const payload = {
      ...form,
      employee: isEdit ? form.employee : pickedEmployee.id,
      // Send null instead of empty string for optional numeric/date fields
      work_permit_expiry: form.work_permit_expiry || null,
      probation_end_date: form.probation_end_date || null,
      hourly_rate: form.hourly_rate === "" ? null : form.hourly_rate,
      annual_salary_cad: form.annual_salary_cad === "" ? null : form.annual_salary_cad,
      vacation_entitlement_weeks: Number(form.vacation_entitlement_weeks) || 0,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCanadaEmployee(id, payload);
        navigate(`/canada/employees/${id}`);
      } else {
        const res = await createCanadaEmployee(payload);
        navigate(`/canada/employees/${res.data.id}`);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setFieldErrors(data);
        setError("Please fix the errors below.");
      } else {
        setError(err.message || "Save failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 11px", border: "0.5px solid #CBD5E1",
    borderRadius: 8, fontSize: 12.5, color: "#0F172A", background: "#fff",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", marginBottom: 5, fontSize: 11.5, color: "#475569", fontWeight: 500,
  };
  const errorText = { color: "#EF4444", fontSize: 11, marginTop: 3 };

  const Field = ({ label, k, type = "text", options, required, span = 1 }) => (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={labelStyle}>{label}{required && " *"}</label>
      {options ? (
        <select value={form[k]} onChange={(e) => handleChange(k, e.target.value)} style={inputStyle}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[k]}
          onChange={(e) => handleChange(k, e.target.value)}
          style={inputStyle}
        />
      )}
      {fieldErrors[k] && <div style={errorText}>{[].concat(fieldErrors[k]).join(", ")}</div>}
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", color: "#94A3B8" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 760 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
          background: "none", border: "none", color: "#64748B",
          fontSize: 12.5, cursor: "pointer", padding: 0,
        }}
      >
        <FiArrowLeft /> Back
      </button>

      <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: "0 0 2px" }}>
        {isEdit ? "Edit Canada employee" : "Add Canada employee"}
      </h1>
      <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 20px" }}>
        {isEdit
          ? "Update Canadian-specific employment details."
          : "Link an existing TAD employee to a Canada Office profile."}
      </p>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "0.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          color: "#991B1B", fontSize: 12.5, display: "flex", gap: 8, alignItems: "center",
        }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Employee picker / display */}
        <div style={{
          background: "#fff", border: "0.5px solid #E2E8F0",
          borderRadius: 12, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 10 }}>
            TAD employee
          </div>

          {isEdit ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", background: "#F8FAFC", borderRadius: 8,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg,#1B4FD8,#818CF8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>
                {pickedEmployee?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "#0F172A" }}>{pickedEmployee?.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  {pickedEmployee?.employee_id} · {pickedEmployee?.designation}
                </div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>Locked while editing</span>
            </div>
          ) : pickedEmployee ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", background: "#ECFDF5", borderRadius: 8,
              border: "0.5px solid #BBF7D0",
            }}>
              <FiCheck style={{ color: "#10B981" }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "#0F172A" }}>{pickedEmployee.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  {pickedEmployee.employee_id} · {pickedEmployee.designation}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPickedEmployee(null); setSearch(""); }}
                style={{
                  marginLeft: "auto", background: "none", border: "none",
                  color: "#64748B", fontSize: 11.5, cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                border: "0.5px solid #CBD5E1", borderRadius: 8, padding: "0 10px",
              }}>
                <FiSearch style={{ color: "#94A3B8", fontSize: 14 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, employee ID, or email…"
                  style={{
                    border: "none", outline: "none", background: "none",
                    fontSize: 12.5, padding: "8px 0", width: "100%",
                  }}
                />
              </div>
              {searching && (
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 8 }}>Searching…</div>
              )}
              {!searching && search.trim() && searchResults.length === 0 && (
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 8 }}>No matching TAD employees found.</div>
              )}
              {searchResults.length > 0 && (
                <div style={{
                  marginTop: 8, maxHeight: 220, overflowY: "auto",
                  border: "0.5px solid #E2E8F0", borderRadius: 8,
                }}>
                  {searchResults.map((emp) => {
                    const alreadyLinked = linkedIds.has(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          if (alreadyLinked) return;
                          setPickedEmployee(emp);
                          setSearch("");
                          setSearchResults([]);
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 10px",
                          borderBottom: "0.5px solid #F1F5F9",
                          cursor: alreadyLinked ? "not-allowed" : "pointer",
                          opacity: alreadyLinked ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!alreadyLinked) e.currentTarget.style.background = "#F8FAFC"; }}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <FiUser style={{ color: "#94A3B8", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: "#0F172A" }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>
                            {emp.employee_id} · {emp.designation}
                          </div>
                        </div>
                        {alreadyLinked && (
                          <span style={{ fontSize: 10.5, color: "#94A3B8" }}>Already linked</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {fieldErrors.employee && <div style={errorText}>{[].concat(fieldErrors.employee).join(", ")}</div>}
            </>
          )}
        </div>

        {/* Employment details */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 12 }}>Employment details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Province" k="province" options={PROVINCES} />
            <Field label="Employment type" k="employment_type" options={EMPLOYMENT_TYPES} />
            <Field label="Status" k="status" options={STATUSES} />
            <Field label="Office location" k="office_location" />
            <Field label="Vacation entitlement (weeks)" k="vacation_entitlement_weeks" type="number" />
            <Field label="Probation end date" k="probation_end_date" type="date" />
          </div>
        </div>

        {/* Compensation */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 12 }}>Compensation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Annual salary (CAD)" k="annual_salary_cad" type="number" />
            <Field label="Hourly rate (CAD)" k="hourly_rate" type="number" />
            <Field label="Pay frequency" k="pay_frequency" options={PAY_FREQUENCIES} />
          </div>
        </div>

        {/* Compliance & banking */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 12 }}>
            Compliance & banking <span style={{ fontWeight: 400, color: "#94A3B8" }}>(optional)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="SIN number" k="sin_number" />
            <Field label="Work permit number" k="work_permit_number" />
            <Field label="Work permit expiry" k="work_permit_expiry" type="date" />
            <div />
            <Field label="Bank transit number" k="bank_transit_number" />
            <Field label="Bank institution number" k="bank_institution_number" />
            <Field label="Bank account number" k="bank_account_number" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "9px 18px", border: "0.5px solid #CBD5E1",
              borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (!isEdit && !pickedEmployee)}
            style={{
              padding: "9px 20px", border: "none", borderRadius: 8,
              background: saving || (!isEdit && !pickedEmployee) ? "#E2E8F0" : "#1B4FD8",
              color: saving || (!isEdit && !pickedEmployee) ? "#94A3B8" : "#fff",
              cursor: saving || (!isEdit && !pickedEmployee) ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 500,
            }}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create Canada profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
