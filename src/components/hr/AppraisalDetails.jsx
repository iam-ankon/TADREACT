import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPerformanceAppraisalById,
  approveIncrement,
  approveDesignation,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const AppraisalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState(null);
  const [loading, setLoading] = useState(false);
  const username = localStorage.getItem("username");

  // Calculate total points
  const totalPoints = useMemo(() => {
    if (!appraisal) return 0;
    const criteriaKeys = [
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

    return criteriaKeys.reduce((sum, key) => {
      const value = appraisal[key];
      return sum + (value ? parseInt(value) || 0 : 0);
    }, 0);
  }, [appraisal]);

  // Calculate grade based on total points
  const getGrade = (points) => {
    if (points >= 47)
      return { grade: "A+", color: "#10B981", bgColor: "#D1FAE5" };
    if (points >= 42)
      return { grade: "A", color: "#3B82F6", bgColor: "#DBEAFE" };
    if (points >= 37)
      return { grade: "B", color: "#8B5CF6", bgColor: "#EDE9FE" };
    if (points >= 32)
      return { grade: "C", color: "#F59E0B", bgColor: "#FEF3C7" };
    return { grade: "D", color: "#EF4444", bgColor: "#FEE2E2" };
  };

  const gradeInfo = getGrade(totalPoints);

  const handleApprove = async (appraisalId) => {
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
      alert("Increment approved successfully!");
      const updatedAppraisal = await getPerformanceAppraisalById(appraisalId);
      setAppraisal(updatedAppraisal.data);
    } catch (err) {
      console.error("❌ Error approving increment:", err);
      alert(
        `Failed to approve increment. Please try again. Error: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAppraisal = async () => {
      try {
        const response = await getPerformanceAppraisalById(id);
        setAppraisal(response.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAppraisal();
  }, [id]);

  const handleApproveDesignation = async (appraisalId) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this designation change? This will update the employee's designation.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const result = await approveDesignation(appraisalId);
      alert("Designation approved successfully!");
      const updatedAppraisal = await getPerformanceAppraisalById(appraisalId);
      setAppraisal(updatedAppraisal.data);
    } catch (err) {
      console.error("❌ Error approving designation:", err);
      alert(
        `Failed to approve designation. Please try again. Error: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const canApproveThisDesignation = () => {
    return (
      appraisal.promotion &&
      !appraisal.designation_approved &&
      appraisal.proposed_designation
    );
  };

  const canApproveIncrement = () => {
    return username === "Tuhin" || username === "admin" || username === "hr";
  };

  const canApproveThisIncrement = () => {
    return appraisal.increment && !appraisal.increment_approved;
  };

  const criteria = [
    {
      name: "Job Knowledge, technical & office equipments skills",
      key: "job_knowledge",
      descriptionKey: "job_description",
      additionalText: "Resourcefulness used in carrying out responsibilities",
      icon: "📚",
    },
    {
      name: "Performance in Meetings deadlines & commitments",
      key: "performance_in_meetings",
      descriptionKey: "performance_description",
      additionalText: "Capability of achieving company's goal",
      icon: "🎯",
    },
    {
      name: "Communication Skills",
      key: "communication_skills",
      descriptionKey: "communication_description",
      additionalText: "Ability to explain, convince and be understood",
      icon: "💬",
    },
    {
      name: "Reliability & Responsibility",
      key: "reliability",
      descriptionKey: "reliability_description",
      additionalText: "Implies the quality to be trustworthy",
      icon: "🤝",
    },
    {
      name: "Initiative & Creativity",
      key: "initiative",
      descriptionKey: "initiative_description",
      additionalText: "Willingness to expand responsibilities",
      icon: "💡",
    },
    {
      name: "Stress Management & Steadiness under pressure",
      key: "stress_management",
      descriptionKey: "stress_management_description",
      additionalText: "Ability to withstand pressure in emergency situations",
      icon: "⚡",
    },
    {
      name: "Co-operation, Team-work & developing others",
      key: "co_operation",
      descriptionKey: "co_operation_description",
      additionalText: "Performance or working co-operatively",
      icon: "👥",
    },
    {
      name: "Leadership, problem-solving & decision-making",
      key: "leadership",
      descriptionKey: "leadership_description",
      additionalText: "Quality of maintaining enthusiasm and team spirit",
      icon: "⭐",
    },
    {
      name: "Discipline and personal image",
      key: "discipline",
      descriptionKey: "discipline_description",
      additionalText: "Reflects attendance, obediency, self confidence",
      icon: "🎖️",
    },
    {
      name: "Ethical Considerations",
      key: "ethical_considerations",
      descriptionKey: "ethical_considerations_description",
      additionalText: "Knowledge of legal compliance",
      icon: "⚖️",
    },
  ];

  // Print function remains the same as your original
  const printPage = () => {
    // Create performance table rows
    const performanceTableRows = criteria
      .map((item) => {
        const score = appraisal[item.key] || "N/A";
        const comment =
          appraisal[item.descriptionKey] || "No comments provided";
        const note = item.additionalText;

        return `
        <tr class="criteria-row">
          <td class="criteria-name"><strong>${item.name}</strong></td>
          <td class="criteria-points" style="text-align: center"><strong>${score}</strong></td>
          <td class="criteria-comment">${comment}</td>
        </tr>
        <tr class="note-row">
          <td colspan="3" class="criteria-note">
            <em>${note}</em>
          </td>
        </tr>
      `;
      })
      .join("");

    // Compact lists
    const performanceList = appraisal.performance?.trim()
      ? appraisal.performance
          .split("\n")
          .map(
            (item, index) => `
            <div class="list-item">
              <div class="list-number">${index + 1}.</div>
              <div class="list-content">${item}</div>
            </div>`,
          )
          .join("")
      : [...Array(5)]
          .map(
            (_, index) => `
            <div class="list-item">
              <div class="list-number">${index + 1}.</div>
              <div class="list-content">...</div>
            </div>`,
          )
          .join("");

    const expectedList = appraisal.expected_performance?.trim()
      ? appraisal.expected_performance
          .split("\n")
          .map(
            (item, index) => `
            <div class="list-item">
              <div class="list-number">${index + 1}.</div>
              <div class="list-content">${item}</div>
            </div>`,
          )
          .join("")
      : [...Array(3)]
          .map(
            (_, index) => `
            <div class="list-item">
              <div class="list-number">${index + 1}.</div>
              <div class="list-content">...</div>
            </div>`,
          )
          .join("");

    const gradeInfo = getGrade(totalPoints);

    const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Performance Appraisal - ${appraisal.name}</title>
        <style>
          /* Ultra Compact Print Styles */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.3;
            color: #000;
            background-color: #fff;
            font-size: 9px;
            padding: 5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 400;
          }
          
          .print-container {
            width: 100%;
            max-width: 100%;
            padding: 8px;
            background: #fff;
          }
          
          /* Header - Ultra Compact */
          .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #0078D4;
          }
          
          .appraisal-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          
          .employee-name {
            font-size: 12px;
            font-weight: 700;
            color: #000;
            margin-bottom: 2px;
          }
          
          .company-name {
            font-size: 8px;
            color: #666;
            font-weight: 600;
          }
          
          /* Employee Info - Ultra Compact */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 8px;
            padding: 6px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #ddd;
            font-size: 8px;
          }
          
          .info-label {
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            margin-bottom: 1px;
          }
          
          .info-value {
            font-weight: 600;
            color: #000;
          }
          
          /* Score Section - Ultra Compact */
          .score-section {
            background: #f0f9ff;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #bae6fd;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .grade-badge {
            background: ${gradeInfo.bgColor};
            color: ${gradeInfo.color};
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 700;
            text-align: center;
            border: 1px solid ${gradeInfo.color};
            min-width: 80px;
          }
          
          .total-score {
            font-size: 16px;
            font-weight: 800;
            display: block;
            line-height: 1;
          }
          
          .grade-letter {
            font-size: 10px;
            font-weight: 700;
            display: block;
          }
          
          .scale-info {
            flex: 1;
            margin-left: 10px;
          }
          
          .scale-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 3px;
            margin-bottom: 5px;
          }
          
          .scale-item {
            text-align: center;
            padding: 3px 2px;
            background: white;
            border-radius: 2px;
            font-size: 7px;
            font-weight: 600;
            border: 1px solid #ddd;
          }
          
          .grade-scale {
            padding: 4px;
            background: linear-gradient(90deg, #ef4444, #f59e0b, #8b5cf6, #3b82f6, #10b981);
            border-radius: 3px;
            text-align: center;
            font-size: 7px;
            font-weight: 700;
            color: white;
            border: 1px solid #000;
          }
          
          /* Performance Table - Ultra Compact */
          .performance-section {
            margin-bottom: 8px;
          }
          
          .section-title {
            font-size: 10px;
            font-weight: 700;
            color: #000;
            padding-bottom: 4px;
            margin-bottom: 6px;
            border-bottom: 1px solid #0078D4;
            text-transform: uppercase;
          }
          
          .performance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            font-size: 8px;
            border: 1px solid #ddd;
          }
          
          .performance-table th {
            background: #e9ecef;
            padding: 4px 6px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            color: #000;
            border-bottom: 1px solid #ddd;
            text-transform: uppercase;
          }
          
          .performance-table td {
            padding: 4px 6px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          
          .criteria-name {
            font-weight: 600;
            color: #000;
            font-size: 8px;
            line-height: 1.2;
          }
          
          .criteria-points {
            text-align: center;
            font-weight: 700;
            font-size: 9px;
            color: #0078D4;
            min-width: 20px;
          }
          
          .criteria-comment {
            font-size: 7px;
            color: #444;
            line-height: 1.2;
          }
          
          .criteria-note {
            font-size: 7px;
            color: #666;
            font-style: italic;
            padding: 2px 6px 4px;
            border-bottom: 1px dashed #ddd;
          }
          
          .note-row {
            background-color: #f9f9f9;
          }
          
          /* Recommendations - Ultra Compact */
          .recommendations {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 8px;
          }
          
          .recommendation-card {
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #ddd;
            background: white;
            text-align: center;
          }
          
          .recommendation-card.active {
            background: ${
              appraisal.promotion
                ? "#e8f4fd"
                : appraisal.increment
                  ? "#e8f8f0"
                  : appraisal.performance_reward
                    ? "#fef9e3"
                    : "#f8f9fa"
            };
            border-color: ${
              appraisal.promotion
                ? "#3b82f6"
                : appraisal.increment
                  ? "#10b981"
                  : appraisal.performance_reward
                    ? "#f59e0b"
                    : "#ddd"
            };
          }
          
          .recommendation-icon {
            font-size: 12px;
            margin-bottom: 4px;
          }
          
          .recommendation-title {
            font-size: 8px;
            font-weight: 700;
            color: #000;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          
          .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 7px;
            font-weight: 700;
            margin-top: 4px;
          }
          
          .status-approved {
            background: #10b981;
            color: white;
          }
          
          .status-pending {
            background: #f59e0b;
            color: white;
          }
          
          /* Lists - Ultra Compact */
          .list-section {
            margin-bottom: 8px;
          }
          
          .list-container {
            background: #f8f9fa;
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #ddd;
          }
          
          .list-item {
            display: flex;
            gap: 6px;
            padding: 3px 0;
            border-bottom: 1px solid #eee;
          }
          
          .list-item:last-child {
            border-bottom: none;
          }
          
          .list-number {
            width: 16px;
            height: 16px;
            background: #0078D4;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 8px;
            flex-shrink: 0;
          }
          
          .list-content {
            flex: 1;
            color: #000;
            line-height: 1.2;
            font-size: 8px;
            font-weight: 500;
          }
          
          /* Salary Comparison - Ultra Compact */
          .salary-section {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            margin-bottom: 8px;
          }
          
          .comparison-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 6px;
          }
          
          .comparison-column {
            padding: 6px;
            background: white;
            border-radius: 4px;
            border: 1px solid #ddd;
            text-align: center;
          }
          
          .column-title {
            font-size: 9px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 6px;
            padding-bottom: 3px;
            border-bottom: 1px solid #0078D4;
            text-transform: uppercase;
          }
          
          .salary-item {
            margin-bottom: 6px;
          }
          
          .salary-label {
            font-size: 7px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          
          .salary-value {
            font-size: 11px;
            font-weight: 800;
            color: #000;
          }
          
          .salary-value.empty {
            color: #999;
            font-style: italic;
            font-size: 10px;
          }
          
          /* Signatures - Ultra Compact */
          .signature-section {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #0078D4;
          }
          
          .signature-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 8px;
          }
          
          .signature-box {
            text-align: center;
            padding: 6px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #ddd;
          }
          
          .signature-line {
            height: 1px;
            background: #000;
            margin: 12px 0 4px;
          }
          
          .signature-label {
            font-size: 8px;
            font-weight: 700;
            color: #1e40af;
            margin-top: 2px;
            text-transform: uppercase;
          }
          
          .signature-title {
            font-size: 6px;
            color: #666;
            text-transform: uppercase;
            margin-top: 1px;
            font-weight: 600;
          }
          
          /* Footer - Ultra Compact */
          .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 7px;
            color: #666;
          }
          
          .footer-info {
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            padding: 4px;
            background: #f8f9fa;
            border-radius: 3px;
            border: 1px solid #eee;
          }
          
          /* Print Specific Styles */
          @media print {
            body {
              padding: 0;
              font-size: 8px;
              margin: 0;
            }
            
            .print-container {
              padding: 5mm;
              max-width: 100%;
              margin: 0;
            }
            
            /* Optimize page breaks */
            .performance-section {
              page-break-inside: auto;
            }
            
            .performance-table {
              page-break-inside: auto;
            }
            
            /* Reduce margins for print */
            .header, .info-grid, .score-section, 
            .section-title, .recommendations, 
            .list-section, .salary-section, 
            .signature-section {
              margin-bottom: 6px;
            }
            
            /* Force tighter spacing */
            h3, h4 {
              margin: 4px 0;
            }
            
            p, div {
              margin: 2px 0;
            }
          }
          
          /* Even tighter for long content */
          .compact-table .performance-table {
            font-size: 7px;
          }
          
          .compact-table .performance-table th,
          .compact-table .performance-table td {
            padding: 3px 4px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <div class="appraisal-title">Performance Appraisal</div>
            <div class="employee-name">${appraisal.name}</div>
            <div class="company-name">Confidential Document</div>
          </div>
          
          <!-- Employee Information -->
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID:</span>
              <span class="info-value">${appraisal.employee_id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Dept:</span>
              <span class="info-value">${appraisal.department}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Designation:</span>
              <span class="info-value">${appraisal.designation}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Join Date:</span>
              <span class="info-value">${appraisal.joining_date}</span>
            </div>
          </div>
          
          <!-- Score Section -->
          <div class="score-section">
            <div class="grade-badge">
              <span class="total-score">${totalPoints}/50</span>
              <span class="grade-letter">Grade: ${gradeInfo.grade}</span>
            </div>
            
            <div class="scale-info">
              <div class="scale-grid">
                <div class="scale-item">5=Excellent</div>
                <div class="scale-item">4=Very Good</div>
                <div class="scale-item">3=Meets Exp.</div>
                <div class="scale-item">2=Fairly Good</div>
                <div class="scale-item">1=Below Exp.</div>
              </div>
              <div class="grade-scale">
                47-50=A+ | 42-46=A | 37-41=B | 32-36=C | <31=D
              </div>
            </div>
          </div>
          
          <!-- Performance Assessment -->
          <div class="performance-section compact-table">
            <h3 class="section-title">Performance Assessment</h3>
            <table class="performance-table">
              <thead>
                <tr>
                  <th width="55%">Criteria</th>
                  <th width="12%" style="text-align: center">Points</th>
                  <th width="33%">Comments</th>
                </tr>
              </thead>
              <tbody>
                ${performanceTableRows}
              </tbody>
            </table>
          </div>
          
          <!-- Recommendations -->
          <div class="recommendations">
            <div class="recommendation-card ${appraisal.promotion ? "active" : ""}">
              <div class="recommendation-icon">👤</div>
              <div class="recommendation-title">Promotion</div>
              <div style="font-size: 8px; margin: 3px 0;">
                ${
                  appraisal.promotion
                    ? `${appraisal.present_designation} → ${appraisal.proposed_designation}`
                    : "Not Recommended"
                }
              </div>
              ${
                appraisal.promotion && appraisal.designation_approved
                  ? '<div class="status-badge status-approved">Approved</div>'
                  : appraisal.promotion
                    ? '<div class="status-badge status-pending">Pending</div>'
                    : ""
              }
            </div>
            
            <div class="recommendation-card ${appraisal.increment ? "active" : ""}">
              <div class="recommendation-icon">💰</div>
              <div class="recommendation-title">Increment</div>
              <div style="font-size: 8px; margin: 3px 0;">
                ${
                  appraisal.increment
                    ? `৳${appraisal.present_salary} → ৳${appraisal.proposed_salary}`
                    : "Not Recommended"
                }
              </div>
              ${
                appraisal.increment && appraisal.increment_approved
                  ? '<div class="status-badge status-approved">Approved</div>'
                  : appraisal.increment
                    ? '<div class="status-badge status-pending">Pending</div>'
                    : ""
              }
            </div>
            
            <div class="recommendation-card ${appraisal.performance_reward ? "active" : ""}">
              <div class="recommendation-icon">🏆</div>
              <div class="recommendation-title">Reward</div>
              <div style="font-size: 8px; margin: 3px 0;">
                ${appraisal.performance_reward ? "Recommended" : "Not Recommended"}
              </div>
              ${
                appraisal.performance_reward
                  ? '<div class="status-badge status-approved">Yes</div>'
                  : ""
              }
            </div>
          </div>
          
          <!-- Performance Notes -->
          <div class="list-section">
            <h3 class="section-title">Performance Notes</h3>
            <div class="list-container">
              ${performanceList}
            </div>
          </div>
          
          <!-- Expected Performance -->
          <div class="list-section">
            <h3 class="section-title">Expected Performance</h3>
            <div class="list-container">
              ${expectedList}
            </div>
          </div>
          
          <!-- Salary & Designation -->
          <div class="salary-section">
            <h3 class="section-title" style="text-align: center;">Salary & Designation</h3>
            <div class="comparison-grid">
              <div class="comparison-column">
                <div class="column-title">Current</div>
                <div class="salary-item">
                  <div class="salary-label">Salary</div>
                  <div class="salary-value">৳${appraisal.present_salary}</div>
                </div>
                <div class="salary-item">
                  <div class="salary-label">Designation</div>
                  <div class="salary-value">${appraisal.present_designation}</div>
                </div>
              </div>
              
              <div class="comparison-column">
                <div class="column-title">Proposed</div>
                <div class="salary-item">
                  <div class="salary-label">Salary</div>
                  <div class="salary-value">৳${appraisal.proposed_salary}</div>
                </div>
                <div class="salary-item">
                  <div class="salary-label">Designation</div>
                  <div class="salary-value">${appraisal.proposed_designation}</div>
                </div>
              </div>
              
              <div class="comparison-column">
                <div class="column-title">Approved</div>
                <div class="salary-item">
                  <div class="salary-label">Salary</div>
                  <div class="salary-value ${appraisal.increment_approved ? "" : "empty"}">
                    ${appraisal.increment_approved ? "৳" + appraisal.proposed_salary : "—"}
                  </div>
                </div>
                <div class="salary-item">
                  <div class="salary-label">Designation</div>
                  <div class="salary-value ${appraisal.designation_approved ? "" : "empty"}">
                    ${appraisal.designation_approved ? appraisal.proposed_designation : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signature-section">
            <h3 class="section-title" style="text-align: center;">Signatures</h3>
            <div class="signature-grid">
              <div class="signature-box">
                <div class="signature-label">Section Head</div>
                <div class="signature-title">Supervisor</div>
                <div class="signature-line"></div>
                <div class="signature-title">Signature & Date</div>
              </div>
              
              <div class="signature-box">
                <div class="signature-label">Dept Head</div>
                <div class="signature-title">Manager</div>
                <div class="signature-line"></div>
                <div class="signature-title">Signature & Date</div>
              </div>
              
              <div class="signature-box">
                <div class="signature-label">Head of HR</div>
                <div class="signature-title">HR</div>
                <div class="signature-line"></div>
                <div class="signature-title">Signature & Date</div>
              </div>
              
              <div class="signature-box">
                <div class="signature-label">Authority</div>
                <div class="signature-title">Management</div>
                <div class="signature-line"></div>
                <div class="signature-title">Signature & Date</div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div>Performance Appraisal Report • ${new Date().toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              },
            )}</div>
            <div class="footer-info">
              <span>ID: APP-${appraisal.id}-${new Date().getFullYear()}</span>
              <span>CONFIDENTIAL</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    // Wait for fonts to load
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  if (!appraisal)
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading appraisal details...</p>
      </div>
    );

  return (
    <div style={containerStyle}>
      <Sidebars />

      <div style={styles.mainContainer}>
        {/* Scrollable Content Area */}
        <div style={styles.contentContainer}>
          {/* Header Section - Fixed */}
          <div style={styles.header}>
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              <span style={styles.backButtonIcon}>←</span>
              Back
            </button>
            <h1 style={styles.title}>Performance Appraisal Details</h1>
            <div style={styles.headerActions}>
              <button style={styles.printButton} onClick={printPage}>
                <span style={styles.printButtonIcon}>🖨️</span>
                Print
              </button>
            </div>
          </div>
          {/* Employee Summary Card */}
          <div style={styles.summaryCard}>
            <div style={styles.employeeInfo}>
              <div style={styles.avatarSection}>
                <div style={styles.avatar}>
                  {appraisal.name?.charAt(0) || "E"}
                </div>
                <div
                  style={{
                    ...styles.gradeBadge,
                    backgroundColor: gradeInfo.bgColor,
                    borderColor: gradeInfo.color,
                  }}
                >
                  <span style={{ color: gradeInfo.color, fontWeight: "bold" }}>
                    {gradeInfo.grade}
                  </span>
                </div>
              </div>

              <div style={styles.basicInfo}>
                <h2 style={styles.employeeName}>{appraisal.name}</h2>
                <div style={styles.employeeMeta}>
                  <span style={styles.metaItem}>
                    <strong>ID:</strong> {appraisal.employee_id}
                  </span>
                  <span style={styles.metaItem}>
                    <strong>Designation:</strong> {appraisal.designation}
                  </span>
                  <span style={styles.metaItem}>
                    <strong>Department:</strong> {appraisal.department_name}
                  </span>
                </div>
              </div>

              <div style={styles.scoreSection}>
                <div style={styles.totalScoreCard}>
                  <div style={styles.scoreLabel}>Total Score</div>
                  <div style={styles.scoreValue}>{totalPoints}/50</div>
                  <div
                    style={{
                      ...styles.scoreGrade,
                      backgroundColor: gradeInfo.bgColor,
                      color: gradeInfo.color,
                    }}
                  >
                    Grade: {gradeInfo.grade}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Dates Grid */}
            <div style={styles.datesGrid}>
              <div style={styles.dateItem}>
                <span style={styles.dateIcon}>📅</span>
                <div>
                  <div style={styles.dateLabel}>Joining Date</div>
                  <div style={styles.dateValue}>{appraisal.joining_date}</div>
                </div>
              </div>
              <div style={styles.dateItem}>
                <span style={styles.dateIcon}>📈</span>
                <div>
                  <div style={styles.dateLabel}>Last Promotion</div>
                  <div style={styles.dateValue}>
                    {appraisal.last_promotion_date}
                  </div>
                </div>
              </div>
              <div style={styles.dateItem}>
                <span style={styles.dateIcon}>💰</span>
                <div>
                  <div style={styles.dateLabel}>Last Increment</div>
                  <div style={styles.dateValue}>
                    {appraisal.last_increment_date}
                  </div>
                </div>
              </div>
              <div style={styles.dateItem}>
                <span style={styles.dateIcon}>🎓</span>
                <div>
                  <div style={styles.dateLabel}>Last Education</div>
                  <div style={styles.dateValue}>{appraisal.last_education}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Assessment Grid */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Performance Assessment</h3>
              <div style={styles.legend}>
                <span style={styles.legendItem}>5=Excellent</span>
                <span style={styles.legendItem}>4=Very Good</span>
                <span style={styles.legendItem}>3=Meets Expectation</span>
                <span style={styles.legendItem}>2=Fairly Good</span>
                <span style={styles.legendItem}>1=Below Expectation</span>
              </div>
            </div>

            <div style={styles.criteriaGrid}>
              {criteria.map((item, index) => {
                const score = appraisal[item.key]
                  ? parseInt(appraisal[item.key])
                  : 0;
                const scoreColor =
                  score >= 4
                    ? "#10B981"
                    : score >= 3
                      ? "#3B82F6"
                      : score >= 2
                        ? "#F59E0B"
                        : "#EF4444";

                return (
                  <div key={index} style={styles.criteriaCard}>
                    <div style={styles.criteriaHeader}>
                      <span style={styles.criteriaIcon}>{item.icon}</span>
                      <h4 style={styles.criteriaName}>{item.name}</h4>
                    </div>

                    <div style={styles.criteriaBody}>
                      <div
                        style={{
                          ...styles.scoreCircle,
                          borderColor: scoreColor,
                        }}
                      >
                        <span
                          style={{
                            color: scoreColor,
                            fontSize: "24px",
                            fontWeight: "bold",
                          }}
                        >
                          {score || "N/A"}
                        </span>
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>
                          /5
                        </span>
                      </div>

                      <div style={styles.commentsSection}>
                        <div style={styles.commentText}>
                          {appraisal[item.descriptionKey] ||
                            "No comments provided"}
                        </div>
                        <div style={styles.additionalText}>
                          <small>{item.additionalText}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recommendations</h3>
            <div style={styles.recommendationsGrid}>
              <div
                style={{
                  ...styles.recommendationCard,
                  ...(appraisal.promotion && styles.recommendationCardActive),
                }}
              >
                <div style={styles.recommendationHeader}>
                  <span
                    style={{
                      ...styles.recommendationIcon,
                      color: appraisal.promotion ? "#3B82F6" : "#9CA3AF",
                    }}
                  >
                    👤
                  </span>
                  <h4 style={styles.recommendationTitle}>Promotion</h4>
                  <div style={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={appraisal.promotion}
                      readOnly
                      style={styles.checkbox}
                    />
                  </div>
                </div>
                {appraisal.promotion && (
                  <>
                    <div style={styles.recommendationContent}>
                      <div style={styles.designationChange}>
                        <span>
                          From: <strong>{appraisal.present_designation}</strong>
                        </span>
                        <span style={{ margin: "0 10px" }}>→</span>
                        <span>
                          To: <strong>{appraisal.proposed_designation}</strong>
                        </span>
                      </div>
                    </div>
                    {!appraisal.designation_approved && (
                      <div style={styles.pendingBadge}>
                        <span style={{ marginRight: "6px" }}>⏱️</span>
                        Pending Approval
                      </div>
                    )}
                  </>
                )}
              </div>

              <div
                style={{
                  ...styles.recommendationCard,
                  ...(appraisal.increment && styles.recommendationCardActive),
                }}
              >
                <div style={styles.recommendationHeader}>
                  <span
                    style={{
                      ...styles.recommendationIcon,
                      color: appraisal.increment ? "#10B981" : "#9CA3AF",
                    }}
                  >
                    💰
                  </span>
                  <h4 style={styles.recommendationTitle}>Increment</h4>
                  <div style={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={appraisal.increment}
                      readOnly
                      style={styles.checkbox}
                    />
                  </div>
                </div>
                {appraisal.increment && (
                  <>
                    <div style={styles.recommendationContent}>
                      <div style={styles.salaryChange}>
                        <span>
                          From: <strong>৳{appraisal.present_salary}</strong>
                        </span>
                        <span style={{ margin: "0 10px" }}>→</span>
                        <span>
                          To: <strong>৳{appraisal.proposed_salary}</strong>
                        </span>
                      </div>
                      {appraisal.salary_text && (
                        <div style={styles.remarks}>
                          <small>{appraisal.salary_text}</small>
                        </div>
                      )}
                    </div>
                    {appraisal.increment_approved ? (
                      <div style={styles.approvedBadge}>
                        <span style={{ marginRight: "6px" }}>✅</span>
                        Approved
                      </div>
                    ) : (
                      <div style={styles.pendingBadge}>
                        <span style={{ marginRight: "6px" }}>⏱️</span>
                        Pending Approval
                      </div>
                    )}
                  </>
                )}
              </div>

              <div
                style={{
                  ...styles.recommendationCard,
                  ...(appraisal.performance_reward &&
                    styles.recommendationCardActive),
                }}
              >
                <div style={styles.recommendationHeader}>
                  <span
                    style={{
                      ...styles.recommendationIcon,
                      color: appraisal.performance_reward
                        ? "#F59E0B"
                        : "#9CA3AF",
                    }}
                  >
                    🏆
                  </span>
                  <h4 style={styles.recommendationTitle}>Performance Reward</h4>
                  <div style={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={appraisal.performance_reward}
                      readOnly
                      style={styles.checkbox}
                    />
                  </div>
                </div>
                {appraisal.performance_reward && (
                  <div style={styles.approvedBadge}>
                    <span style={{ marginRight: "6px" }}>✅</span>
                    Recommended
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Notes Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Performance Notes</h3>
            <div style={styles.notesContainer}>
              {appraisal.performance && appraisal.performance.trim() !== ""
                ? appraisal.performance.split("\n").map((item, index) => (
                    <div key={index} style={styles.noteItem}>
                      <div style={styles.noteNumber}>{index + 1}</div>
                      <div style={styles.noteContent}>{item}</div>
                    </div>
                  ))
                : [...Array(5)].map((_, index) => (
                    <div key={index} style={styles.noteItem}>
                      <div style={styles.noteNumber}>{index + 1}</div>
                      <div style={styles.notePlaceholder}>...</div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Expected Performance Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              Expected Performance After Changes
            </h3>
            <div style={styles.notesContainer}>
              {appraisal.expected_performance &&
              appraisal.expected_performance.trim() !== ""
                ? appraisal.expected_performance
                    .split("\n")
                    .map((item, index) => (
                      <div key={index} style={styles.noteItem}>
                        <div style={styles.noteNumber}>{index + 1}</div>
                        <div style={styles.noteContent}>{item}</div>
                      </div>
                    ))
                : [...Array(3)].map((_, index) => (
                    <div key={index} style={styles.noteItem}>
                      <div style={styles.noteNumber}>{index + 1}</div>
                      <div style={styles.notePlaceholder}>...</div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Approval Actions */}
          <div style={styles.approvalSection}>
            <div style={styles.approvalButtons}>
              {canApproveIncrement() && canApproveThisIncrement() && (
                <button
                  onClick={() => handleApprove(appraisal.id)}
                  disabled={loading}
                  style={
                    loading
                      ? styles.approveButtonDisabled
                      : styles.approveButton
                  }
                >
                  <span style={styles.buttonIcon}>💰</span>
                  {loading ? "Approving..." : "Approve Increment"}
                </button>
              )}

              {canApproveIncrement() && canApproveThisDesignation() && (
                <button
                  onClick={() => handleApproveDesignation(appraisal.id)}
                  disabled={loading}
                  style={
                    loading
                      ? styles.approveButtonDisabled
                      : styles.approveButtonSecondary
                  }
                >
                  <span style={styles.buttonIcon}>👤</span>
                  {loading ? "Approving..." : "Approve Designation"}
                </button>
              )}

              {appraisal.increment_approved && (
                <div style={styles.statusBadge}>
                  <span style={{ marginRight: "8px" }}>✅</span>
                  Increment Approved
                </div>
              )}

              {appraisal.designation_approved && (
                <div style={styles.statusBadgeSecondary}>
                  <span style={{ marginRight: "8px" }}>✅</span>
                  Designation Approved
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle = {
  display: "flex",
  backgroundColor: "#f8fafc",
  minHeight: "100vh",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  overflow: "hidden", // Prevent body scroll
};

const styles = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f8fafc",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #3B82F6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  mainContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  // Fixed Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    flexShrink: 0,
    zIndex: 10,
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#e2e8f0",
    },
  },
  backButtonIcon: {
    fontSize: "18px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  printButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#2563eb",
    },
  },
  printButtonIcon: {
    fontSize: "18px",
  },
  // Scrollable Content Area
  contentContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    backgroundColor: "#f8fafc",
    // Custom scrollbar styles
    scrollbarWidth: "thin",
    scrollbarColor: "#cbd5e1 #f1f5f9",
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "4px",
      "&:hover": {
        background: "#94a3b8",
      },
    },
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  employeeInfo: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
    gap: "24px",
    flexWrap: "wrap",
  },
  avatarSection: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "600",
  },
  gradeBadge: {
    position: "absolute",
    bottom: "-8px",
    backgroundColor: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    border: "2px solid #e2e8f0",
    fontSize: "12px",
    fontWeight: "600",
  },
  basicInfo: {
    flex: 1,
    minWidth: "300px",
  },
  employeeName: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  employeeMeta: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: "14px",
    color: "#64748b",
  },
  scoreSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  totalScoreCard: {
    textAlign: "center",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    minWidth: "120px",
  },
  scoreLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  scoreValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "4px",
  },
  scoreGrade: {
    fontSize: "14px",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  datesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  dateItem: {
    display: "flex",
    alignItems: "center",
  },
  dateIcon: {
    fontSize: "18px",
    marginRight: "12px",
  },
  dateLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
  },
  dateValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  legend: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#64748b",
    flexWrap: "wrap",
  },
  legendItem: {
    padding: "4px 8px",
    backgroundColor: "#f1f5f9",
    borderRadius: "4px",
  },
  criteriaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "16px",
    maxHeight: "600px",
    overflowY: "auto",
    paddingRight: "8px",
    // Custom scrollbar for criteria grid
    scrollbarWidth: "thin",
    scrollbarColor: "#cbd5e1 transparent",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
      "&:hover": {
        background: "#94a3b8",
      },
    },
  },
  criteriaCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    transition: "all 0.2s",
    "&:hover": {
      borderColor: "#3B82F6",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
  },
  criteriaHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    gap: "12px",
  },
  criteriaIcon: {
    fontSize: "20px",
  },
  criteriaName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    flex: 1,
  },
  criteriaBody: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  scoreCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #e2e8f0",
    flexShrink: 0,
  },
  commentsSection: {
    flex: 1,
    maxHeight: "80px",
    overflowY: "auto",
    paddingRight: "4px",
    // Custom scrollbar for comments
    scrollbarWidth: "thin",
    scrollbarColor: "#e2e8f0 transparent",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
      borderRadius: "2px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#e2e8f0",
      borderRadius: "2px",
    },
  },
  commentText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.5",
    marginBottom: "8px",
  },
  additionalText: {
    fontSize: "11px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  recommendationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
  recommendationCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    transition: "all 0.2s",
  },
  recommendationCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#f8fafc",
  },
  recommendationHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    gap: "10px",
  },
  recommendationIcon: {
    fontSize: "20px",
  },
  recommendationTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    flex: 1,
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "default",
  },
  recommendationContent: {
    marginBottom: "12px",
  },
  designationChange: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#475569",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  salaryChange: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#475569",
    flexWrap: "wrap",
  },
  remarks: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "8px",
    fontStyle: "italic",
  },
  pendingBadge: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    backgroundColor: "#fef3c7",
    color: "#d97706",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    width: "fit-content",
  },
  approvedBadge: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    backgroundColor: "#d1fae5",
    color: "#059669",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    width: "fit-content",
  },
  notesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "300px",
    overflowY: "auto",
    paddingRight: "8px",
    // Custom scrollbar for notes
    scrollbarWidth: "thin",
    scrollbarColor: "#cbd5e1 transparent",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
      "&:hover": {
        background: "#94a3b8",
      },
    },
  },
  noteItem: {
    display: "flex",
    gap: "16px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    borderLeft: "4px solid #3B82F6",
    flexShrink: 0,
  },
  noteNumber: {
    width: "28px",
    height: "28px",
    backgroundColor: "#3B82F6",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    flexShrink: 0,
  },
  noteContent: {
    flex: 1,
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  notePlaceholder: {
    flex: 1,
    fontSize: "14px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  approvalSection: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  approvalButtons: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  approveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#10B981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#059669",
    },
  },
  approveButtonSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#2563eb",
    },
  },
  approveButtonDisabled: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#9CA3AF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontSize: "14px",
    fontWeight: "600",
  },
  buttonIcon: {
    fontSize: "18px",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#d1fae5",
    color: "#059669",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  statusBadgeSecondary: {
    display: "flex",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
};

// Add CSS animation for spinner using style tag
const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Add style tag to head
if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = spinnerStyle;
  document.head.appendChild(styleTag);
}

export default AppraisalDetails;
