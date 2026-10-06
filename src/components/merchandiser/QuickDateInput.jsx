// src/components/merchandiser/QuickDateInput.jsx
//
// Date field for the order forms that doesn't make you type the year every
// time: "15/10", "15-10", "15 oct", "oct 15" or "1510" all become
// 15 Oct <year>. The year is the one used in the last date entered on the
// page (or found on an order being edited), else the current year - so an
// order for next season only needs the year typed once. A full year still
// works ("15/10/27", "15/10/2027"). Day comes before month (dd/mm), and the
// result is shown with the month name so there's no doubt how it was read.
// The calendar button opens the browser's normal date picker.
//
// value/onChange use the same Date objects the forms already keep
// (UTC midnight, i.e. new Date("YYYY-MM-DD")).

import React, { useEffect, useRef, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Shared by every QuickDateInput on the page: the year to assume.
let lastYear = new Date().getFullYear();

const pad = (n) => String(n).padStart(2, "0");

const toIso = (date) => (date instanceof Date && !isNaN(date) ? date.toISOString().split("T")[0] : "");

const formatDisplay = (date) => {
  const iso = toIso(date);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const month = MONTHS[Number(m) - 1];
  return `${d} ${month[0].toUpperCase()}${month.slice(1)} ${y}`;
};

const build = (day, month, year) => {
  if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const full = year < 100 ? 2000 + year : year;
  const date = new Date(`${full}-${pad(month)}-${pad(day)}`);
  // Reject 31 Feb etc. (the Date constructor would roll it over).
  if (isNaN(date) || date.getUTCDate() !== day) return null;
  return date;
};

/** Text -> Date (UTC midnight), undefined when it can't be read. */
export const parseQuickDate = (text) => {
  const s = String(text || "").trim().toLowerCase();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return build(d, m, y) || undefined;
  }

  const tokens = s.split(/[\s/.,\-]+/).filter(Boolean);
  const monthIdx = tokens.findIndex((t) => /[a-z]/.test(t));
  if (monthIdx >= 0) {
    const month = MONTHS.indexOf(tokens[monthIdx].slice(0, 3)) + 1;
    const nums = tokens.filter((_, i) => i !== monthIdx).map(Number);
    if (!month || nums.length === 0 || nums.length > 2 || nums.some(isNaN)) return undefined;
    return build(nums[0], month, nums[1] ?? lastYear) || undefined;
  }

  let nums = tokens.map(Number);
  if (nums.some(isNaN)) return undefined;
  if (tokens.length === 1) {
    // Digits only: ddmm, ddmmyy, ddmmyyyy
    const t = tokens[0];
    if (t.length === 4) nums = [+t.slice(0, 2), +t.slice(2, 4)];
    else if (t.length === 6) nums = [+t.slice(0, 2), +t.slice(2, 4), +t.slice(4)];
    else if (t.length === 8) nums = [+t.slice(0, 2), +t.slice(2, 4), +t.slice(4)];
    else return undefined;
  }
  if (nums.length < 2 || nums.length > 3) return undefined;
  return build(nums[0], nums[1], nums[2] ?? lastYear) || undefined;
};

const QuickDateInput = ({ value, onChange, style, disabled, placeholder = "dd/mm  (year auto)" }) => {
  const [text, setText] = useState(formatDisplay(value));
  const [invalid, setInvalid] = useState(false);
  const pickerRef = useRef(null);

  // Follow outside changes (order loaded, auto-calculated dates...).
  useEffect(() => {
    setText(formatDisplay(value));
    setInvalid(false);
    if (value instanceof Date && !isNaN(value)) lastYear = value.getUTCFullYear();
  }, [value]);

  const commit = (date) => {
    if (date) lastYear = date.getUTCFullYear();
    setInvalid(false);
    setText(formatDisplay(date));
    if (toIso(date) !== toIso(value)) onChange(date);
  };

  const handleBlur = () => {
    const parsed = parseQuickDate(text);
    if (parsed === undefined) {
      setInvalid(true);
      return;
    }
    commit(parsed);
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el || disabled) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        title="Type day/month, e.g. 15/10 - the year is filled in for you"
        onChange={(e) => {
          setText(e.target.value);
          setInvalid(false);
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleBlur();
          }
        }}
        style={{
          ...style,
          paddingRight: 34,
          ...(invalid ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}),
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={openPicker}
        disabled={disabled}
        title="Pick from calendar"
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          border: "none",
          background: "transparent",
          color: "#64748b",
          cursor: disabled ? "default" : "pointer",
          padding: 4,
          display: "flex",
        }}
      >
        <FaCalendarAlt size={13} />
      </button>
      {/* Hidden native input, only used for its calendar popup. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={toIso(value)}
        onChange={(e) => commit(e.target.value ? new Date(e.target.value) : null)}
        style={{ position: "absolute", right: 0, bottom: 0, width: 1, height: 1, opacity: 0, border: 0, padding: 0 }}
      />
      {invalid && (
        <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 3 }}>
          Couldn't read that date - try 15/10 or 15/10/2026
        </div>
      )}
    </div>
  );
};

export default QuickDateInput;
