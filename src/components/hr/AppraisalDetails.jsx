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
        "Are you sure you want to approve this increment? This will update the employee's salary."
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
        `Failed to approve increment. Please try again. Error: ${err.message}`
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
        "Are you sure you want to approve this designation change? This will update the employee's designation."
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
        `Failed to approve designation. Please try again. Error: ${err.message}`
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
    const performanceItems = criteria
      .map(
        (item) => `
            <div class="item">
              <span class="label">${item.name}:</span>
              <span class="value">${appraisal[item.key]}</span>
              <span class="value">${appraisal[item.descriptionKey]}</span>
            </div>
            <!-- Additional Text -->
            <div class="item additional-text">
              <span class="additional-text-value">
                <small style="font-style: italic; color: #777;">${
                  item.additionalText
                }</small>
              </span>
            </div>
          `
      )
      .join("");

    const performanceList = appraisal.performance?.trim()
      ? appraisal.performance
          .split("\n")
          .map(
            (item, index) => `
              <div class="numbered-item">
                <span class="number">${index + 1})</span>
                <span class="dotted-line">${item}</span>
              </div>`
          )
          .join("")
      : [...Array(5)]
          .map(
            (_, index) => `
              <div class="numbered-item">
                <span class="number">${index + 1})</span>
                <span class="dotted-line">... ...</span>
              </div>`
          )
          .join("");

    const expectedList = appraisal.expected_performance?.trim()
      ? appraisal.expected_performance
          .split("\n")
          .map(
            (item, index) => `
              <div class="numbered-item">
                <span class="number">${index + 1})</span>
                <span class="dotted-line">${item}</span>
              </div>`
          )
          .join("")
      : [...Array(3)]
          .map(
            (_, index) => `
              <div class="numbered-item">
                <span class="number">${index + 1})</span>
                <span class="dotted-line">... ...</span>
              </div>`
          )
          .join("");

    const printContent = `
                <html>
                  <head>
                    <style>
                      body {
                        line-height: 1.2;
                        color: #333;
                        background-color: #fff;
                        margin: 0;
                        padding: 10px;
                        font-size: 12px;
                      }
                      .container {
                        width: 100%;
                        max-width: 800px;
                        margin: auto;
                        padding: 10px;
                      }
                      h2 {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                        font-size: 16px;
                      }
                      .details-container {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-between;
                      }
                      .details-item {
                        width: 48%;
                        margin-bottom: 5px;
                      }
                      .label {
                        font-weight: bold;
                        color: #2a2a2a;
                      }
                      .value {
                        color: #555;
                      }
                      .vertical-container {
                        margin-top: 10px;
                        border: 1px solid #333;
                        padding: 5px;
                        background-color: #f9f9f9;
                        page-break-inside: avoid;
                      }
                      .vertical-container .item {
                        display: grid;
                        grid-template-columns: 70% 15% auto;
                        align-items: start;
                        gap: 5px;
                        margin-bottom: 3px;
                        padding: 3px;
                      }
                      .final-selection {
                      display: flex;
                      gap: 20px;
                      align-items: center;
                      }
                      .recommended-text {
                          margin-top: 10px;
                          font-style: italic;
                          color: #555;
                      }
                      .performances-text {
                          margin-top: 10px;
                          font-style: italic;
                          color: #555;
                      }
                      .iteme {
                      display: flex;
                      align-items: center;
                      }
      
                      .label {
                      margin-right: 10px;
                      }
      
                      .numbered-item {
                        margin: 5px 0;
                      }
                      .signature-container {
                        margin-top: 20px;
                        border: 1px solid #333;
                        padding: 10px;
                        background-color: #f1f1f1;
                        page-break-inside: avoid;
                      }
      
                      .item {
                          display: grid;
                          grid-template-columns: 70% 15% 15%;
                          gap: 10px;
                          margin-bottom: 10px;
                      }
      
                      .item .label {
                          font-weight: bold;
                      }
      
                      .item .value {
                          font-weight: normal;
                      }
      
                      .item.additional-text {
                          grid-column: 1 / 3;
                          padding-left: 10px;
                      }
      
                      .item .value {
                          font-size: 12px;
                      }
      
      
                      .salary-designation-columns {
                      display: flex;
                      justify-content: space-between;
                      gap: 20px;
                      }
      
                      .column {
                      display: flex;
                      flexDirection: column;
                      gap: 10px;
                      flex: 1;
                      }
      
                      .row {
                      display: flex;
                      justify-content: space-between;
                      }
      
                      .label {
                      font-weight: bold;
                      }
      
                      .value {
                      color: #555;
                      }
      
                      .signature-columns {
                      display: flex;
                      justify-content: space-between;
                      gap: 20px;
                      margin-top: 50px;
                      }
      
                      .signature-column {
                      text-align: center;
                      width: 23%;
                      }
      
                      .signature-label {
                      font-weight: bold;
                      margin-top: 5px;
                      }
      
                      .signature-line {
                      width: 100%;
                      border-bottom: 1px solid #000;
                      margin-bottom: 5px;
                      }
      
                      .vertical-container .item .value {
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                      }
      
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <h2>${appraisal.name}'s APPRAISAL</h2>
            
                      <div class="details-container">
                        <div class="details-item"><span class="label">Employee ID:</span> ${
                          appraisal.employee_id
                        }</div>
                        <div class="details-item"><span class="label">Name:</span> ${
                          appraisal.name
                        }</div>
                        <div class="details-item"><span class="label">Department:</span> ${
                          appraisal.department
                        }</div>
                        <div class="details-item"><span class="label">Designation:</span> ${
                          appraisal.designation
                        }</div>
                        <div class="details-item"><span class="label">Last Promotion Date:</span> ${
                          appraisal.last_promotion_date
                        }</div>
                        <div class="details-item"><span class="label">Joining Date:</span> ${
                          appraisal.joining_date
                        }</div>
                        <div class="details-item"><span class="label">Last Increment Date:</span> ${
                          appraisal.last_increment_date
                        }</div>
                        <div class="details-item"><span class="label">Last Education:</span> ${
                          appraisal.last_education
                        }</div>
                        <div class="vertical-container">47-50 = A+ | 42-46 = A | 37-41 = B | 32-36 = C | <31 = D</div>
                      </div>
            
                      <div class="vertical-container">
                        <div class="item">
                          <span class="value">5 = Excellent | 4 = Very Good | 3 = Meets Expectation | 2 = Fairly Good | 1 = Below Expectation</span>
                        </div>
                        <div class="item">
                          <span class="label">Performance Rating Standards:</span>
                          <span class="label">Points:</span>
                          <span class="label">Comments:</span>
                        </div>
                        ${performanceItems}
                      </div>
            
                      <div class="final-selection">
                      <span class="recommended-text">Recommended for</span>
                      <div class="iteme">
                          <span class="label">Promotion:</span>
                          <input type="checkbox" ${
                            appraisal.promotion ? "checked" : ""
                          } />
                      </div>
                      <div class="iteme">
                          <span class="label">Increment:</span>
                          <input type="checkbox" ${
                            appraisal.increment ? "checked" : ""
                          }  />
                      </div>
                      <div class="iteme">
                          <span class="label">Performance Reward:</span>
                          <input type="checkbox" ${
                            appraisal.performance_reward ? "checked" : ""
                          }  />
                      </div>
                      <span class="performances-text">for the following performances</span>
                      </div>
      
                      <div class="numbered-list">
                        <h3>Performance Notes:</h3>
                        ${performanceList}
                      </div>
            
                      <div class="numbered-list">
                        <h3 style="font-size: 16px; font-weight: bold; color: #0078D4;">Expected performances after Promotion / increment/performance reward:</h3>
                        ${expectedList}
                      </div>
            
                      <div class="signature-container">
                      <h3 style="font-size: 16px; font-weight: bold; color: #0078D4;">Salary & Designation</h3>
                      <div class="salary-designation-columns">
                          <div class="column">
                          <div class="row">
                              <span class="label">Present Salary:</span>
                              <span class="value">${
                                appraisal.present_salary
                              }</span>
                          </div>
                          <div class="row">
                              <span class="label">Present Designation:</span>
                              <span class="value">${
                                appraisal.present_designation
                              }</span>
                          </div>
                          </div>
                          <div class="column">
                          <div class="row">
                              <span class="label">Proposed Salary:</span>
                              <span class="value">${
                                appraisal.proposed_salary
                              }</span>
                          </div>
                          <div class="row">
                              <span class="label">Proposed Designation:</span>
                              <span class="value">${
                                appraisal.proposed_designation
                              }</span>
                          </div>
                          </div>
                          <div class="column">
                          <div class="row">
                              <span class="label">Approved Salary:</span>
                              <span class="value"></span>
                          </div>
                          <div class="row">
                              <span class="label">Approved Designation:</span>
                              <span class="value"></span>
                          </div>
                          </div>
                      </div>
      
                      <h3 style="font-size: 16px; font-weight: bold; color: #0078D4; margin-top: 20px;">Signature</h3>
                      <div class="signature-columns">
                          <div class="signature-column">
                          <div class="signature-line"></div>
                          <span class="signature-label">Section Head</span>
                          </div>
                          <div class="signature-column">
                          <div class="signature-line"></div>
                          <span class="signature-label">Department Head</span>
                          </div>
                          <div class="signature-column">
                          <div class="signature-line"></div>
                          <span class="signature-label">Head of HR</span>
                          </div>
                          <div class="signature-column">
                          <div class="signature-line"></div>
                          <span class="signature-label">Authority</span>
                          </div>
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
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    iframe.contentWindow.print();
    document.body.removeChild(iframe);
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
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
