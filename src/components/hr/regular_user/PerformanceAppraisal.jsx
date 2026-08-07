// src/components/PerformanceAppraisal/PerformanceAppraisal.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPerformanceAppraisals,
  createPerformanceAppraisal,
  updatePerformanceAppraisal,
  getEmployees,
  approveIncrement,
} from "../../../api/employeeApi";

// Initial form data structure
const initialFormData = {
  employee_id: "",
  name: "",
  designation: "",
  joining_date: "",
  department: "",
  last_increment_date: "",
  last_promotion_date: "",
  last_education: "",
  job_knowledge: "",
  job_description: "",
  performance_in_meetings: "",
  performance_description: "",
  communication_skills: "",
  communication_description: "",
  reliability: "",
  reliability_description: "",
  initiative: "",
  initiative_description: "",
  stress_management: "",
  stress_management_description: "",
  co_operation: "",
  co_operation_description: "",
  leadership: "",
  leadership_description: "",
  discipline: "",
  discipline_description: "",
  ethical_considerations: "",
  ethical_considerations_description: "",
  promotion: false,
  increment: false,
  performance_reward: false,
  performance: "",
  expected_performance: "",
  present_salary: "",
  proposed_salary: "",
  present_designation: "",
  proposed_designation: "",
  salary_text: "",
};

// Load app state from localStorage
const loadAppStateFromStorage = () => {
  try {
    const savedState = localStorage.getItem("performanceAppraisalAppState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        formData: parsed.formData || initialFormData,
        viewMode: parsed.viewMode || "list",
        employeeSearch: parsed.employeeSearch || "",
      };
    }
  } catch (error) {
    console.error("Error loading app state from storage:", error);
  }
  return {
    formData: initialFormData,
    viewMode: "list",
    employeeSearch: "",
  };
};

// Save app state to localStorage
const saveAppStateToStorage = (formData, viewMode, employeeSearch) => {
  try {
    localStorage.setItem(
      "performanceAppraisalAppState",
      JSON.stringify({
        formData,
        viewMode,
        employeeSearch,
      }),
    );
  } catch (error) {
    console.error("Error saving app state to storage:", error);
  }
};

// Clear app state from localStorage
const clearAppStateFromStorage = () => {
  try {
    localStorage.removeItem("performanceAppraisalAppState");
  } catch (error) {
    console.error("Error clearing app state from storage:", error);
  }
};

const PerformanceAppraisal = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [selectedAppraisalDetails, setSelectedAppraisalDetails] =
    useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const navigate = useNavigate();

  const savedState = loadAppStateFromStorage();
  const [formData, setFormData] = useState(savedState.formData);
  const [viewMode, setViewMode] = useState(savedState.viewMode);
  const [employeeSearch, setEmployeeSearch] = useState(
    savedState.employeeSearch,
  );

  useEffect(() => {
    const initializeData = async () => {
      await fetchEmployees();
      await fetchAppraisals();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (viewMode === "form" && !selectedAppraisal) {
      saveAppStateToStorage(formData, viewMode, employeeSearch);
    }
  }, [formData, viewMode, employeeSearch, selectedAppraisal]);

  const fetchAppraisals = async () => {
    try {
      setLoading(true);

      const [appraisalsResponse, employeesResponse] = await Promise.all([
        getPerformanceAppraisals(),
        getEmployees(),
      ]);

      let allAppraisals = appraisalsResponse.data || appraisalsResponse || [];
      let allEmployees = employeesResponse.data || employeesResponse || [];

      const currentUsername = localStorage.getItem("username") || "";
      const currentUserEmployeeId = localStorage.getItem("employee_id") || "";
      const currentUserName = localStorage.getItem("employee_name") || "";
      const permissions = JSON.parse(
        localStorage.getItem("permissions") || "{}",
      );
      const hasFullAccess = permissions.full_access === true;
      const mode = localStorage.getItem("mode") || "";

      console.log("=".repeat(60));
      console.log("🔍 FETCHING APPRAISALS");
      console.log("👤 Username:", currentUsername);
      console.log("👤 Employee ID:", currentUserEmployeeId);
      console.log("👤 Employee Name:", currentUserName);
      console.log("🔐 Has Full Access:", hasFullAccess);
      console.log("📊 Total Appraisals:", allAppraisals.length);
      console.log("📊 Total Employees:", allEmployees.length);
      console.log("=".repeat(60));

      let filteredAppraisals = [];

      // FULL ACCESS USERS - can see all appraisals
      const fullAccessUsers = [
        "ankon",
        "Tuhin",
        "Lisa",
        "Samad",
        "ASHIKUR1",
        "LAILA",
        "ZOHAER",
        "Sohel",
      ];

      if (
        fullAccessUsers.includes(currentUsername) ||
        hasFullAccess ||
        mode === "full_access"
      ) {
        console.log("👑 Full access user - showing all appraisals");
        filteredAppraisals = allAppraisals;
      } else {
        // For team leaders - find employees who report to this user
        console.log("🔍 Finding team members for:", currentUserName);

        // Method 1: Find employees where reporting_leader contains current user's name
        const teamMembers = allEmployees.filter((emp) => {
          const reportingLeader = (emp.reporting_leader || "").toLowerCase();
          const userNameMatch = currentUserName.toLowerCase();
          const userEmployeeIdMatch = currentUserEmployeeId.toLowerCase();

          // Check various patterns
          const matches =
            reportingLeader.includes(userNameMatch) ||
            reportingLeader.includes(userEmployeeIdMatch) ||
            reportingLeader.includes(currentUsername.toLowerCase()) ||
            (userNameMatch.includes("mizan") &&
              reportingLeader.includes("mr. mizan")) ||
            (userNameMatch.includes("mizan") &&
              reportingLeader.includes("mizan"));

          if (matches && emp.employee_id !== currentUserEmployeeId) {
            console.log(
              `  ✅ Team member: ${emp.name} (${emp.employee_id}) - Reports to: ${emp.reporting_leader}`,
            );
          }

          return matches;
        });

        // Get employee IDs of team members
        const teamEmployeeIds = teamMembers.map((emp) => emp.employee_id);

        // Always include the user's own ID
        if (
          currentUserEmployeeId &&
          !teamEmployeeIds.includes(currentUserEmployeeId)
        ) {
          teamEmployeeIds.push(currentUserEmployeeId);
        }

        console.log("📋 Team Employee IDs:", teamEmployeeIds);
        console.log("📋 Team Members Count:", teamMembers.length);

        // Filter appraisals for team members
        filteredAppraisals = allAppraisals.filter((appraisal) =>
          teamEmployeeIds.includes(appraisal.employee_id),
        );

        console.log(
          `📊 Found ${filteredAppraisals.length} appraisals for team`,
        );

        // Log which appraisals were found
        filteredAppraisals.forEach((app) => {
          console.log(
            `  - ${app.name} (${app.employee_id}) - Score: ${app.total_score || "N/A"}`,
          );
        });
      }

      setAppraisals(filteredAppraisals);
    } catch (err) {
      setError("Failed to fetch performance appraisals");
      console.error("Error fetching appraisals:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const currentUsername = localStorage.getItem("username") || "";
      const currentUserEmployeeId = localStorage.getItem("employee_id") || "";
      const permissions = JSON.parse(
        localStorage.getItem("permissions") || "{}",
      );
      const hasFullAccess = permissions.full_access === true;

      console.log("=".repeat(60));
      console.log("🔍 FETCHING EMPLOYEES");
      console.log("👤 Username:", currentUsername);
      console.log("👤 Current User Employee ID:", currentUserEmployeeId);
      console.log("=".repeat(60));

      const response = await getEmployees(1, 500, false);

      let allEmployees = [];
      if (response.data && Array.isArray(response.data)) {
        allEmployees = response.data;
      } else if (response.data && response.data.results) {
        allEmployees = response.data.results;
      }

      console.log(`📊 Total employees from API: ${allEmployees.length}`);

      // Check if current user is in the list
      const currentUserInList = allEmployees.find(
        (emp) => emp.employee_id === currentUserEmployeeId,
      );
      if (!currentUserInList) {
        console.warn("⚠️ Current user not found in employees list!");
        // Try to fetch current user separately
        try {
          const currentUserResponse = await getEmployeeById(
            currentUserEmployeeId,
          );
          if (currentUserResponse.data) {
            allEmployees.push(currentUserResponse.data);
            console.log("✅ Added current user to employees list");
          }
        } catch (err) {
          console.error("Could not fetch current user:", err);
        }
      }

      setEmployees(allEmployees);
    } catch (err) {
      console.error("❌ Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const currentUserEmployeeId = localStorage.getItem("employee_id");
    const currentUsername = localStorage.getItem("username");
    const currentUserName = localStorage.getItem("employee_name") || "";
    const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
    const hasFullAccess = permissions.full_access === true;
    const mode = localStorage.getItem("mode") || "";

    console.log("🔍 FILTERING EMPLOYEES FOR APPRAISAL");
    console.log("Current Username:", currentUsername);
    console.log("Current Employee ID:", currentUserEmployeeId);
    console.log("Current Name:", currentUserName);
    console.log("Has Full Access:", hasFullAccess);
    console.log("Mode:", mode);
    console.log("Search term:", employeeSearch || "(empty - showing all)");

    // FULL ACCESS USERS - can see all employees (including themselves if needed)
    const fullAccessUsers = [
      "ankon",
      "Tuhin",
      "Lisa",
      "Samad",
      "ASHIKUR1",
      "LAILA",
      "Sohel",
    ];

    if (
      fullAccessUsers.includes(currentUsername) ||
      hasFullAccess ||
      mode === "full_access"
    ) {
      console.log("👑 Full access - showing all employees");

      // If search term exists, filter, otherwise show all
      let filtered = employees;
      if (employeeSearch && employeeSearch.trim()) {
        const searchTerm = employeeSearch.toLowerCase();
        filtered = employees.filter((emp) => {
          return (
            emp.name?.toLowerCase().includes(searchTerm) ||
            emp.employee_id?.toLowerCase().includes(searchTerm) ||
            emp.designation?.toLowerCase().includes(searchTerm)
          );
        });
      }

      console.log(`Found ${filtered.length} employees`);
      return filtered;
    }

    // ZOHAER - only see team members (Mr. Morshed's team), NOT himself
    if (currentUsername === "ZOHAER") {
      console.log(
        "🔍 ZOHAER - showing Mr. Morshed's team only (excluding self)",
      );

      // Get all team members first
      let teamMembers = employees.filter((emp) => {
        // Don't show ZOHAER himself
        if (emp.employee_id === currentUserEmployeeId) return false;

        // Check if employee reports to Mr. Morshed
        const reportingLeader = (emp.reporting_leader || "").toLowerCase();
        return (
          reportingLeader.includes("mr. morshed") ||
          reportingLeader.includes("morshed") ||
          reportingLeader.includes("zohaer")
        );
      });

      // Apply search filter if search term exists
      if (employeeSearch && employeeSearch.trim()) {
        const searchTerm = employeeSearch.toLowerCase();
        teamMembers = teamMembers.filter((emp) => {
          return (
            emp.name?.toLowerCase().includes(searchTerm) ||
            emp.employee_id?.toLowerCase().includes(searchTerm) ||
            emp.designation?.toLowerCase().includes(searchTerm)
          );
        });
      }

      console.log(`🔍 ZOHAER - Found ${teamMembers.length} team members`);
      teamMembers.forEach((emp) => {
        console.log(
          `  - ${emp.name} (${emp.employee_id}) - Reports to: ${emp.reporting_leader}`,
        );
      });
      return teamMembers;
    }

    // TEAM LEADERS - only see team members, NOT themselves
    console.log("🔍 Team Leader - showing team members only (excluding self)");

    // First, find all employees who report to this team leader
    let teamMembers = employees.filter((emp) => {
      // Exclude self
      if (emp.employee_id === currentUserEmployeeId) return false;

      const reportingLeader = (emp.reporting_leader || "").toLowerCase();
      const userNameMatch = currentUserName.toLowerCase();
      const userEmployeeIdMatch = currentUserEmployeeId.toLowerCase();
      const usernameMatch = currentUsername.toLowerCase();

      // Check various patterns for reporting relationship
      return (
        reportingLeader.includes(userNameMatch) ||
        reportingLeader.includes(userEmployeeIdMatch) ||
        reportingLeader.includes(usernameMatch)
      );
    });

    // Also check using the REPORTING_PATTERNS from backend
    const reportingPatterns = {
      MIZANUR2: ["mr. mizan", "mizanur", "mizan"],
      SHAFIQUL: ["md. shafiqul islam", "shafiqul islam", "shafiq"],
      SHAMOLY: ["ms. shamoly sultana", "shamoly sultana", "shamoly"],
      HABIBUR: ["mr. habib", "habibur", "habib"],
      ATIQUZZAMAN: ["mr. atiquzzaman", "atiquzzaman", "atiq"],
      SOYEB: ["mr. soyeb rahman", "soyeb rahman", "soyeb"],
      AMRAN: ["mr. amran", "amran khan", "amran"],
      AARIJAH: ["ms. auhona rashid", "auhona rashid", "auhona"],
      MAHMUDA: ["ms. mahmuda", "mahmuda hossain", "mahmuda"],
      SOHEL1: ["mr. sohel rana", "sohel rana", "sohel"],
      NAYEEM: ["mr. nayeem", "nayeem hasan", "nayeem"],
      SWAPON: ["mr. swapon", "swapon kumar", "swapon"],
      ABIR: ["mr. abir", "abir sultana", "abir"],
      ATIQUR: ["mr. atiq", "atiqur rahman", "atiq"],
    };

    const patterns = reportingPatterns[currentUsername] || [];

    // Add team members based on patterns
    const patternTeamMembers = employees.filter((emp) => {
      if (emp.employee_id === currentUserEmployeeId) return false;

      const reportingLeader = (emp.reporting_leader || "").toLowerCase();
      for (const pattern of patterns) {
        if (reportingLeader.includes(pattern.toLowerCase())) {
          return true;
        }
      }
      return false;
    });

    // Combine both methods and remove duplicates
    const allTeamMembers = [...teamMembers, ...patternTeamMembers];
    const uniqueTeamMembers = allTeamMembers.filter(
      (emp, index, self) =>
        index === self.findIndex((e) => e.employee_id === emp.employee_id),
    );

    // Apply search filter if search term exists
    let filtered = uniqueTeamMembers;
    if (employeeSearch && employeeSearch.trim()) {
      const searchTerm = employeeSearch.toLowerCase();
      filtered = uniqueTeamMembers.filter((emp) => {
        return (
          emp.name?.toLowerCase().includes(searchTerm) ||
          emp.employee_id?.toLowerCase().includes(searchTerm) ||
          emp.designation?.toLowerCase().includes(searchTerm)
        );
      });
    }

    console.log(
      `🔍 Team Leader - Found ${filtered.length} team members matching`,
    );
    console.log(`📊 Total team members: ${uniqueTeamMembers.length}`);

    return filtered;
  }, [employees, employeeSearch]);

  const handleEmployeeSelect = (employeeId, employee) => {
    if (!employeeId) return;

    console.log("📝 Selected employee:", employee);

    // Find the complete employee data
    const selectedEmployee = employees.find(
      (emp) => emp.employee_id === employeeId,
    );

    if (selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        employee_id: selectedEmployee.employee_id,
        name: selectedEmployee.name,
        designation: selectedEmployee.designation,
        joining_date: selectedEmployee.joining_date,
        department:
          selectedEmployee.department_name || selectedEmployee.department || "",
        present_designation: selectedEmployee.designation,
        present_salary: selectedEmployee.salary || "",
      }));

      setEmployeeSearch(
        `${selectedEmployee.name} (${selectedEmployee.employee_id})`,
      );
    } else {
      console.warn("Employee not found in list:", employeeId);
    }

    setShowEmployeeDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleApproveIncrement = async (appraisalId) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this increment? This will update the employee's salary.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const result = await approveIncrement(appraisalId);
      alert(
        "Increment approved successfully! Employee salary has been updated.",
      );
      await fetchAppraisals();

      if (
        viewMode === "details" &&
        selectedAppraisalDetails &&
        selectedAppraisalDetails.id === appraisalId
      ) {
        const response = await getPerformanceAppraisals();
        const updatedAppraisals = response.data || response || [];
        const updatedAppraisal = updatedAppraisals.find(
          (app) => app.id === appraisalId,
        );
        if (updatedAppraisal) {
          setSelectedAppraisalDetails(updatedAppraisal);
        }
      }
    } catch (err) {
      console.error("Error approving increment:", err);
      alert(
        `Failed to approve increment. Please try again. Error: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const numberFields = [
        "job_knowledge",
        "performance_in_meetings",
        "communication_skills",
        "reliability",
        "initiative",
        "stress_management",
        "co_operation",
        "leadership",
        "discipline",
        "ethical_considerations",
      ];

      const dateFields = [
        "last_increment_date",
        "last_promotion_date",
        "joining_date",
      ];

      const cleanFormData = {
        ...formData,
        ...Object.fromEntries(
          numberFields.map((field) => [
            field,
            formData[field] === "" ? null : parseInt(formData[field]),
          ]),
        ),
        ...Object.fromEntries(
          dateFields.map((field) => [
            field,
            formData[field] === "" ? null : formData[field],
          ]),
        ),
      };

      if (selectedAppraisal) {
        await updatePerformanceAppraisal(selectedAppraisal.id, cleanFormData);
        alert("Appraisal updated successfully!");
      } else {
        await createPerformanceAppraisal(cleanFormData);
        alert("Appraisal Added Successfully!");
      }

      setViewMode("list");
      setSelectedAppraisal(null);
      resetForm();
      fetchAppraisals();
    } catch (err) {
      setError("Failed to save performance appraisal");
      console.error("Error saving appraisal:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEmployeeSearch("");
    clearAppStateFromStorage();
  };

  const handleNewAppraisal = () => {
    setViewMode("form");
    setSelectedAppraisal(null);
    resetForm();
  };

  const handleEdit = (appraisal) => {
    setSelectedAppraisal(appraisal);
    const departmentName = getDepartmentName(appraisal);
    setFormData({
      employee_id: appraisal.employee_id,
      name: appraisal.name,
      designation: appraisal.designation,
      joining_date: appraisal.joining_date || "",
      department: departmentName,
      last_increment_date: appraisal.last_increment_date || "",
      last_promotion_date: appraisal.last_promotion_date || "",
      last_education: appraisal.last_education || "",
      job_knowledge: appraisal.job_knowledge || "",
      job_description: appraisal.job_description || "",
      performance_in_meetings: appraisal.performance_in_meetings || "",
      performance_description: appraisal.performance_description || "",
      communication_skills: appraisal.communication_skills || "",
      communication_description: appraisal.communication_description || "",
      reliability: appraisal.reliability || "",
      reliability_description: appraisal.reliability_description || "",
      initiative: appraisal.initiative || "",
      initiative_description: appraisal.initiative_description || "",
      stress_management: appraisal.stress_management || "",
      stress_management_description:
        appraisal.stress_management_description || "",
      co_operation: appraisal.co_operation || "",
      co_operation_description: appraisal.co_operation_description || "",
      leadership: appraisal.leadership || "",
      leadership_description: appraisal.leadership_description || "",
      discipline: appraisal.discipline || "",
      discipline_description: appraisal.discipline_description || "",
      ethical_considerations: appraisal.ethical_considerations || "",
      ethical_considerations_description:
        appraisal.ethical_considerations_description || "",
      promotion: appraisal.promotion || false,
      increment: appraisal.increment || false,
      performance_reward: appraisal.performance_reward || false,
      performance: appraisal.performance || "",
      expected_performance: appraisal.expected_performance || "",
      present_salary: appraisal.present_salary || "",
      proposed_salary: appraisal.proposed_salary || "",
      present_designation: appraisal.present_designation || "",
      proposed_designation: appraisal.proposed_designation || "",
      salary_text: appraisal.salary_text || "",
    });
    setEmployeeSearch(`${appraisal.name} (${appraisal.employee_id})`);
    setViewMode("form");
  };

  const handleViewDetails = (appraisal) => {
    setSelectedAppraisalDetails(appraisal);
    setViewMode("details");
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedAppraisal(null);
    resetForm();
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedAppraisalDetails(null);
    clearAppStateFromStorage();
  };

  const calculateTotalScore = (appraisal) => {
    const scores = [
      appraisal.job_knowledge,
      appraisal.performance_in_meetings,
      appraisal.communication_skills,
      appraisal.reliability,
      appraisal.initiative,
      appraisal.stress_management,
      appraisal.co_operation,
      appraisal.leadership,
      appraisal.discipline,
      appraisal.ethical_considerations,
    ];
    return (
      scores.reduce((total, score) => total + (parseInt(score) || 0), 0) * 2
    );
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#10b981";
    if (score >= 70) return "#3b82f6";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getDepartmentName = (appraisal) => {
    if (!appraisal) return "N/A";
    if (appraisal.department && typeof appraisal.department === "object") {
      return appraisal.department.department_name || "N/A";
    }
    if (typeof appraisal.department === "string") {
      return appraisal.department;
    }
    if (appraisal.department_name) {
      return appraisal.department_name;
    }
    return "N/A";
  };

  const canApproveIncrement = () => {
    const username = localStorage.getItem("username");
    const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
    return permissions.full_access === true || username === "Tuhin";
  };

  const canApproveThisIncrement = (appraisal) => {
    return appraisal.increment && !appraisal.increment_approved;
  };

  const calculateLengthOfService = (joiningDate) => {
    if (!joiningDate) return "N/A";
    try {
      const joinDate = new Date(joiningDate);
      const today = new Date();
      let years = today.getFullYear() - joinDate.getFullYear();
      let months = today.getMonth() - joinDate.getMonth();
      let days = today.getDate() - joinDate.getDate();
      if (days < 0) {
        months--;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      const diffTime = Math.abs(today - joinDate);
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (years > 0) {
        return `${years} year${years > 1 ? "s" : ""}, ${months} month${months > 1 ? "s" : ""}, ${days} day${days > 1 ? "s" : ""} (${totalDays} days)`;
      } else if (months > 0) {
        return `${months} month${months > 1 ? "s" : ""}, ${days} day${days > 1 ? "s" : ""} (${totalDays} days)`;
      } else {
        return `${days} day${days > 1 ? "s" : ""} (${totalDays} days)`;
      }
    } catch (error) {
      return "Invalid date";
    }
  };
  // Styles
  const containerStyle = {
    padding: "70px",

    margin: "0 auto",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  };

  const buttonStyle = {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  };

  const buttonHoverStyle = {
    backgroundColor: "#2563eb",
  };

  const formContainerStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    padding: "32px",
    marginBottom: "24px",
  };

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  };

  const sectionContainerStyle = {
    gridColumn: "span 1",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  };

  const fullWidthSectionStyle = {
    ...sectionContainerStyle,
    gridColumn: "span 2",
  };

  const sectionTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
  };

  const fieldContainerStyle = {
    marginBottom: "16px",
    position: "relative",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: "6px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "white",
    transition: "border-color 0.2s",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  const checkboxContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  };

  const checkboxStyle = {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
    cursor: "pointer",
  };

  const buttonContainerStyle = {
    gridColumn: "span 2",
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "24px",
  };

  const dropdownStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 1000,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  const dropdownItemStyle = {
    padding: "10px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
  };

  const tableContainerStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    padding: "24px",
    overflow: "hidden",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle = {
    padding: "16px",
    textAlign: "left",
    borderBottom: "2px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px",
  };

  const tdStyle = {
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
  };

  const scoreBadgeStyle = (score) => ({
    padding: "4px 12px",
    borderRadius: "20px",
    backgroundColor: getScoreColor(score) + "20",
    color: getScoreColor(score),
    fontWeight: "600",
    fontSize: "12px",
  });

  const recommendationBadgeStyle = {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    marginRight: "4px",
  };

  // Details View Styles
  const detailsContainerStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  };

  const detailsSectionStyle = {
    marginBottom: "24px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  };

  const detailsSectionTitleStyle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e5e7eb",
  };

  const detailsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  };

  const detailItemStyle = {
    fontSize: "14px",
    color: "#4b5563",
  };

  const scoresGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  };

  const scoreItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  };

  const scoreLabelStyle = {
    fontSize: "14px",
    color: "#4b5563",
  };

  const scoreValueStyle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  };

  const recommendationsStyle = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  };

  const recommendationBadgeStyleDetails = {
    padding: "6px 12px",
    backgroundColor: "#f59e0b",
    color: "white",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  };

  const noRecommendationStyle = {
    color: "#6c757d",
    fontStyle: "italic",
    fontSize: "14px",
  };

  const salaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  };

  const salaryColumnStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const salaryItemStyle = {
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
  };

  // AppraisalDetailsView Component
  const AppraisalDetailsView = ({
    appraisal,
    calculateTotalScore,
    getScoreColor,
    handleApproveIncrement,
    canApproveIncrement,
    canApproveThisIncrement,
  }) => {
    const totalScore = calculateTotalScore(appraisal);

    return (
      <div style={detailsContainerStyle}>
        {/* Employee Information */}
        <div style={detailsSectionStyle}>
          <h4 style={detailsSectionTitleStyle}>Employee Information</h4>
          <div style={detailsGridStyle}>
            <div style={detailItemStyle}>
              <strong>Employee ID:</strong> {appraisal.employee_id}
            </div>
            <div style={detailItemStyle}>
              <strong>Name:</strong> {appraisal.name}
            </div>
            <div style={detailItemStyle}>
              <strong>Designation:</strong> {appraisal.designation}
            </div>
            <div style={detailItemStyle}>
              <strong>Department:</strong> {getDepartmentName(appraisal)}
            </div>
            <div style={detailItemStyle}>
              <strong>Joining Date:</strong> {appraisal.joining_date}
            </div>
            <div style={detailItemStyle}>
              <strong>Total Score:</strong>
              <span style={scoreBadgeStyle(totalScore)}>{totalScore}/100</span>
            </div>
          </div>
        </div>

        {/* Performance Scores */}
        <div style={detailsSectionStyle}>
          <h4 style={detailsSectionTitleStyle}>Performance Scores</h4>
          <div style={scoresGridStyle}>
            {[
              { label: "Job Knowledge", value: appraisal.job_knowledge },
              {
                label: "Performance in Meetings",
                value: appraisal.performance_in_meetings,
              },
              {
                label: "Communication Skills",
                value: appraisal.communication_skills,
              },
              { label: "Reliability", value: appraisal.reliability },
              { label: "Initiative", value: appraisal.initiative },
              {
                label: "Stress Management",
                value: appraisal.stress_management,
              },
              { label: "Co-operation", value: appraisal.co_operation },
              { label: "Leadership", value: appraisal.leadership },
              { label: "Discipline", value: appraisal.discipline },
              {
                label: "Ethical Considerations",
                value: appraisal.ethical_considerations,
              },
            ].map((item, index) => (
              <div key={index} style={scoreItemStyle}>
                <span style={scoreLabelStyle}>{item.label}:</span>
                <span style={scoreValueStyle}>{item.value || "N/A"}/5</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Needed */}
        <div style={detailsSectionStyle}>
          <h4 style={detailsSectionTitleStyle}>Recommendations</h4>
          <div style={recommendationsStyle}>
            {appraisal.promotion && (
              <span style={recommendationBadgeStyleDetails}>
                Promotion Recommended
              </span>
            )}
            {appraisal.increment && (
              <span style={recommendationBadgeStyleDetails}>
                {appraisal.increment_approved
                  ? "Increment Approved"
                  : "Increment Recommended"}
              </span>
            )}
            {appraisal.performance_reward && (
              <span style={recommendationBadgeStyleDetails}>
                Performance Reward Recommended
              </span>
            )}
            {!appraisal.promotion &&
              !appraisal.increment &&
              !appraisal.performance_reward && (
                <span style={noRecommendationStyle}>No recommendations</span>
              )}
          </div>

          {/* Approve Increment Button - Show only if user has permission AND increment is recommended but not approved */}
          {canApproveIncrement() && canApproveThisIncrement(appraisal) && (
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => handleApproveIncrement(appraisal.id)}
                style={{
                  backgroundColor: "#22c55e",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#22c55e";
                }}
              >
                Approve Increment
              </button>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic",
                }}
              >
                Click to approve increment and update employee salary
              </div>
            </div>
          )}

          {/* Show message if increment is already approved */}
          {appraisal.increment_approved && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                ✅ Increment has been approved and salary updated
              </div>
            </div>
          )}
        </div>

        {/* Performance Descriptions */}
        <div style={detailsSectionStyle}>
          <h4 style={detailsSectionTitleStyle}>Performance Notes</h4>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "14px",
              color: "#4b5563",
            }}
          >
            {appraisal.performance || "No performance notes available."}
          </div>
        </div>

        {/* Expected Performance */}
        <div style={detailsSectionStyle}>
          <h4 style={detailsSectionTitleStyle}>Expected Performance</h4>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "14px",
              color: "#4b5563",
            }}
          >
            {appraisal.expected_performance ||
              "No expected performance notes available."}
          </div>
        </div>

        {/* Salary & Designation */}
        <div style={detailsSectionStyle}>
          <h4 style={detailsSectionTitleStyle}>Salary & Designation</h4>
          <div style={salaryGridStyle}>
            <div style={salaryColumnStyle}>
              <div style={salaryItemStyle}>
                <strong>Present Salary:</strong> {appraisal.present_salary}
              </div>
              <div style={salaryItemStyle}>
                <strong>Present Designation:</strong>{" "}
                {appraisal.present_designation}
              </div>
            </div>
            <div style={salaryColumnStyle}>
              <div style={salaryItemStyle}>
                <strong>Proposed Salary:</strong> {appraisal.proposed_salary}
              </div>
              <div style={salaryItemStyle}>
                <strong>Proposed Salary Remarks:</strong>{" "}
                {appraisal.salary_text}
              </div>
              <div style={salaryItemStyle}>
                <strong>Proposed Designation:</strong>{" "}
                {appraisal.proposed_designation}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Performance Appraisal</h1>
        {viewMode === "list" && (
          <button
            onClick={handleNewAppraisal}
            style={buttonStyle}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor =
                buttonHoverStyle.backgroundColor)
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = buttonStyle.backgroundColor)
            }
          >
            + New Appraisal
          </button>
        )}
        {(viewMode === "form" || viewMode === "details") && (
          <button
            onClick={handleBackToList}
            style={{
              ...buttonStyle,
              backgroundColor: "#6c757d",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#5a6268")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}
          >
            ← Back to List
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Appraisal Form */}
      {viewMode === "form" && (
        <div style={formContainerStyle}>
          <h3
            style={{
              ...sectionTitleStyle,
              fontSize: "20px",
              textAlign: "center",
            }}
          >
            {selectedAppraisal
              ? "Edit Performance Appraisal"
              : "New Performance Appraisal"}
          </h3>
          <form onSubmit={handleSubmit} style={formGridStyle}>
            {/* Employee Information Section */}
            <div style={sectionContainerStyle}>
              <h3 style={sectionTitleStyle}>Employee Information</h3>

              <div style={fieldContainerStyle}>
                <label htmlFor="employee-search" style={labelStyle}>
                  Search Employee *
                </label>
                <input
                  type="text"
                  id="employee-search"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  style={inputStyle}
                  placeholder="Search by name, ID, or designation..."
                  required
                />
                {showEmployeeDropdown && filteredEmployees.length > 0 && (
                  <div style={dropdownStyle}>
                    {filteredEmployees.map((emp) => (
                      <div
                        key={emp.employee_id}
                        style={dropdownItemStyle}
                        onClick={() =>
                          handleEmployeeSelect(emp.employee_id, emp)
                        }
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#f3f4f6")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
                      >
                        <div>
                          <strong>{emp.name}</strong>
                        </div>
                        <div>
                          ID: {emp.employee_id} | {emp.designation}
                        </div>
                        <div>
                          Dept: {emp.department_name || emp.department} | Phone:{" "}
                          {emp.personal_phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="employee_id" style={labelStyle}>
                  Employee ID
                </label>
                <input
                  type="text"
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="name" style={labelStyle}>
                  Employee Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="designation" style={labelStyle}>
                  Designation
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label style={labelStyle}>Length of Service</label>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    backgroundColor: "#f9fafb",
                    color: "#374151",
                  }}
                >
                  {formData.joining_date
                    ? calculateLengthOfService(formData.joining_date)
                    : "Enter joining date"}
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Calculated from joining date
                </div>
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="joining_date" style={labelStyle}>
                  Joining Date
                </label>
                <input
                  type="date"
                  id="joining_date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="department" style={labelStyle}>
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="last_increment_date" style={labelStyle}>
                  Increment Date
                </label>
                <input
                  type="date"
                  id="last_increment_date"
                  name="last_increment_date"
                  value={formData.last_increment_date}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="last_promotion_date" style={labelStyle}>
                  Promotion Date
                </label>
                <input
                  type="date"
                  id="last_promotion_date"
                  name="last_promotion_date"
                  value={formData.last_promotion_date}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="last_education" style={labelStyle}>
                  Last Education
                </label>
                <input
                  type="text"
                  id="last_education"
                  name="last_education"
                  value={formData.last_education}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Performance and Salary Details Section */}
            <div style={sectionContainerStyle}>
              <h3 style={sectionTitleStyle}>Performance and Salary Details</h3>

              <div style={fieldContainerStyle}>
                <label htmlFor="performance" style={labelStyle}>
                  Performance
                </label>
                <textarea
                  id="performance"
                  name="performance"
                  value={formData.performance}
                  onChange={handleInputChange}
                  style={textareaStyle}
                  placeholder="Describe current performance..."
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="expected_performance" style={labelStyle}>
                  Expected Performance
                </label>
                <textarea
                  id="expected_performance"
                  name="expected_performance"
                  value={formData.expected_performance}
                  onChange={handleInputChange}
                  style={textareaStyle}
                  placeholder="Describe expected performance improvements..."
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="present_salary" style={labelStyle}>
                  Present Salary
                </label>
                <input
                  type="text"
                  id="present_salary"
                  name="present_salary"
                  value={formData.present_salary}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="proposed_salary" style={labelStyle}>
                  Proposed Salary
                </label>
                <input
                  type="text"
                  id="proposed_salary"
                  name="proposed_salary"
                  value={formData.proposed_salary}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div style={fieldContainerStyle}>
                <label htmlFor="salary_text" style={labelStyle}>
                  Proposed Salary Remarks
                </label>
                <textarea
                  type="text"
                  id="salary_text"
                  name="salary_text"
                  value={formData.salary_text}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Write something about his/her salary..."
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="present_designation" style={labelStyle}>
                  Present Designation
                </label>
                <input
                  type="text"
                  id="present_designation"
                  name="present_designation"
                  value={formData.present_designation}
                  onChange={handleInputChange}
                  style={inputStyle}
                  readOnly
                />
              </div>

              <div style={fieldContainerStyle}>
                <label htmlFor="proposed_designation" style={labelStyle}>
                  Proposed Designation
                </label>
                <input
                  type="text"
                  id="proposed_designation"
                  name="proposed_designation"
                  value={formData.proposed_designation}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: "20px" }}>
                <h4
                  style={{
                    ...sectionTitleStyle,
                    fontSize: "16px",
                    marginBottom: "12px",
                  }}
                >
                  Recommendations
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      id="promotion"
                      name="promotion"
                      checked={formData.promotion}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    <label htmlFor="promotion" style={labelStyle}>
                      Promotion Recommended
                    </label>
                  </div>
                  <div style={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      id="increment"
                      name="increment"
                      checked={formData.increment}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    <label htmlFor="increment" style={labelStyle}>
                      Increment Recommended
                    </label>
                  </div>
                  <div style={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      id="performance_reward"
                      name="performance_reward"
                      checked={formData.performance_reward}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    <label htmlFor="performance_reward" style={labelStyle}>
                      Performance Reward Recommended
                    </label>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  Check the recommendations for this employee
                </div>
              </div>
            </div>

            {/* Appraisal Details Section */}
            <div style={fullWidthSectionStyle}>
              <h3 style={sectionTitleStyle}>Appraisal Details</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "24px",
                }}
              >
                {/* Column 1 */}
                <div>
                  <div style={fieldContainerStyle}>
                    <label htmlFor="job_knowledge" style={labelStyle}>
                      Job Knowledge (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="job_knowledge"
                      name="job_knowledge"
                      value={formData.job_knowledge}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="job_description" style={labelStyle}>
                      Job Description
                    </label>
                    <textarea
                      id="job_description"
                      name="job_description"
                      value={formData.job_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="performance_in_meetings" style={labelStyle}>
                      Performance in Meetings (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="performance_in_meetings"
                      name="performance_in_meetings"
                      value={formData.performance_in_meetings}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="performance_description" style={labelStyle}>
                      Performance Description
                    </label>
                    <textarea
                      id="performance_description"
                      name="performance_description"
                      value={formData.performance_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="communication_skills" style={labelStyle}>
                      Communication Skills (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="communication_skills"
                      name="communication_skills"
                      value={formData.communication_skills}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label
                      htmlFor="communication_description"
                      style={labelStyle}
                    >
                      Communication Description
                    </label>
                    <textarea
                      id="communication_description"
                      name="communication_description"
                      value={formData.communication_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div>
                  <div style={fieldContainerStyle}>
                    <label htmlFor="reliability" style={labelStyle}>
                      Reliability (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="reliability"
                      name="reliability"
                      value={formData.reliability}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="reliability_description" style={labelStyle}>
                      Reliability Description
                    </label>
                    <textarea
                      id="reliability_description"
                      name="reliability_description"
                      value={formData.reliability_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="initiative" style={labelStyle}>
                      Initiative (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="initiative"
                      name="initiative"
                      value={formData.initiative}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="initiative_description" style={labelStyle}>
                      Initiative Description
                    </label>
                    <textarea
                      id="initiative_description"
                      name="initiative_description"
                      value={formData.initiative_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="stress_management" style={labelStyle}>
                      Stress Management (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="stress_management"
                      name="stress_management"
                      value={formData.stress_management}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label
                      htmlFor="stress_management_description"
                      style={labelStyle}
                    >
                      Stress Management Description
                    </label>
                    <textarea
                      id="stress_management_description"
                      name="stress_management_description"
                      value={formData.stress_management_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>
                </div>

                {/* Column 3 */}
                <div>
                  <div style={fieldContainerStyle}>
                    <label htmlFor="co_operation" style={labelStyle}>
                      Co-operation (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="co_operation"
                      name="co_operation"
                      value={formData.co_operation}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label
                      htmlFor="co_operation_description"
                      style={labelStyle}
                    >
                      Co-operation Description
                    </label>
                    <textarea
                      id="co_operation_description"
                      name="co_operation_description"
                      value={formData.co_operation_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="leadership" style={labelStyle}>
                      Leadership (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="leadership"
                      name="leadership"
                      value={formData.leadership}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="leadership_description" style={labelStyle}>
                      Leadership Description
                    </label>
                    <textarea
                      id="leadership_description"
                      name="leadership_description"
                      value={formData.leadership_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>
                </div>

                {/* Column 4 */}
                <div>
                  <div style={fieldContainerStyle}>
                    <label htmlFor="discipline" style={labelStyle}>
                      Discipline (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="discipline"
                      name="discipline"
                      value={formData.discipline}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="discipline_description" style={labelStyle}>
                      Discipline Description
                    </label>
                    <textarea
                      id="discipline_description"
                      name="discipline_description"
                      value={formData.discipline_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label htmlFor="ethical_considerations" style={labelStyle}>
                      Ethical Considerations (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      id="ethical_considerations"
                      name="ethical_considerations"
                      value={formData.ethical_considerations}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldContainerStyle}>
                    <label
                      htmlFor="ethical_considerations_description"
                      style={labelStyle}
                    >
                      Ethical Considerations Description
                    </label>
                    <textarea
                      id="ethical_considerations_description"
                      name="ethical_considerations_description"
                      value={formData.ethical_considerations_description}
                      onChange={handleInputChange}
                      style={textareaStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={buttonContainerStyle}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonStyle,
                  backgroundColor: loading
                    ? "#9ca3af"
                    : buttonStyle.backgroundColor,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor =
                      buttonHoverStyle.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor =
                      buttonStyle.backgroundColor;
                  }
                }}
              >
                {loading
                  ? "Saving..."
                  : selectedAppraisal
                    ? "Update Appraisal"
                    : "Save Appraisal"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#6c757d",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#5a6268")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#6c757d")
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appraisal Details View */}
      {viewMode === "details" && selectedAppraisalDetails && (
        <div style={tableContainerStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={sectionTitleStyle}>Appraisal Details</h3>
            <button
              onClick={handleBackToList}
              style={{
                ...buttonStyle,
                backgroundColor: "#6c757d",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#5a6268")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}
            >
              ← Back to List
            </button>
          </div>

          <AppraisalDetailsView
            appraisal={selectedAppraisalDetails}
            calculateTotalScore={calculateTotalScore}
            getScoreColor={getScoreColor}
            handleApproveIncrement={handleApproveIncrement}
            canApproveIncrement={canApproveIncrement}
            canApproveThisIncrement={canApproveThisIncrement}
          />
        </div>
      )}

      {/* Appraisals List */}
      {viewMode === "list" && (
        <div style={tableContainerStyle}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: "20px" }}>
            Performance Appraisals
          </h3>
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}
            >
              Loading appraisals...
            </div>
          ) : appraisals.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}
            >
              No performance appraisals found. Create your first appraisal
              above.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Designation</th>
                    <th style={thStyle}>Department</th>
                    <th style={thStyle}>Total Score</th>
                    <th style={thStyle}>Recommendations</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appraisals.map((appraisal) => {
                    const totalScore = calculateTotalScore(appraisal);
                    return (
                      <tr
                        key={appraisal.id}
                        style={{ borderBottom: "1px solid #e5e7eb" }}
                      >
                        <td style={tdStyle}>
                          <div>
                            <strong>{appraisal.name}</strong>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              ID: {appraisal.employee_id}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>{appraisal.designation}</td>
                        <td style={tdStyle}>{getDepartmentName(appraisal)}</td>
                        <td style={tdStyle}>
                          <span style={scoreBadgeStyle(totalScore)}>
                            {totalScore}/100
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                            }}
                          >
                            {appraisal.promotion && (
                              <span
                                style={{
                                  ...recommendationBadgeStyle,
                                  backgroundColor: "#f59e0b20",
                                  color: "#f59e0b",
                                  border: "1px solid #f59e0b",
                                }}
                              >
                                Promotion
                              </span>
                            )}
                            {appraisal.increment && (
                              <span
                                style={{
                                  ...recommendationBadgeStyle,
                                  backgroundColor: appraisal.increment_approved
                                    ? "#10b98120"
                                    : "#f59e0b20",
                                  color: appraisal.increment_approved
                                    ? "#10b981"
                                    : "#f59e0b",
                                  border: appraisal.increment_approved
                                    ? "1px solid #10b981"
                                    : "1px solid #f59e0b",
                                }}
                              >
                                {appraisal.increment_approved
                                  ? "Increment Approved"
                                  : "Increment"}
                              </span>
                            )}
                            {appraisal.performance_reward && (
                              <span
                                style={{
                                  ...recommendationBadgeStyle,
                                  backgroundColor: "#f59e0b20",
                                  color: "#f59e0b",
                                  border: "1px solid #f59e0b",
                                }}
                              >
                                Reward
                              </span>
                            )}
                            {!appraisal.promotion &&
                              !appraisal.increment &&
                              !appraisal.performance_reward && (
                                <span
                                  style={{ color: "#6c757d", fontSize: "12px" }}
                                >
                                  No Recommendations
                                </span>
                              )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleEdit(appraisal)}
                              style={{
                                backgroundColor: "#10b981",
                                color: "white",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                              onMouseEnter={(e) =>
                                (e.target.style.backgroundColor = "#059669")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = "#10b981")
                              }
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewDetails(appraisal)}
                              style={{
                                backgroundColor: "#3b82f6",
                                color: "white",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                              onMouseEnter={(e) =>
                                (e.target.style.backgroundColor = "#2563eb")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = "#3b82f6")
                              }
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceAppraisal;
