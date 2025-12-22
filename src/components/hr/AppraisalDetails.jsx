import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
      console.log(
        `🖱️ Approve button clicked in AppraisalDetails for ID: ${appraisalId}`
      );

      const result = await approveIncrement(appraisalId);
      console.log("✅ API call successful:", result);

      alert("Increment approved successfully!");

      // Refresh appraisal data
      const updatedAppraisal = await getPerformanceAppraisalById(appraisalId);
      console.log("🔄 Updated appraisal data:", updatedAppraisal.data);
      setAppraisal(updatedAppraisal.data);
    } catch (err) {
      console.error("❌ Error approving increment:", err);
      console.error("Error response:", err.response?.data);
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

  if (!appraisal) return <p>Loading...</p>;

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
      console.log(
        `🖱️ Approve Designation button clicked in AppraisalDetails for ID: ${appraisalId}`
      );

      const result = await approveDesignation(appraisalId);
      console.log("✅ API call successful:", result);

      alert("Designation approved successfully!");

      // Refresh appraisal data
      const updatedAppraisal = await getPerformanceAppraisalById(appraisalId);
      console.log("🔄 Updated appraisal data:", updatedAppraisal.data);
      setAppraisal(updatedAppraisal.data);
    } catch (err) {
      console.error("❌ Error approving designation:", err);
      console.error("Error response:", err.response?.data);
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
  // Check if user can approve increments
  const canApproveIncrement = () => {
    return username === "Tuhin" || username === "admin" || username === "hr";
  };

  // Check if this specific increment can be approved
  const canApproveThisIncrement = () => {
    return appraisal.increment && !appraisal.increment_approved;
  };

  const criteria = [
    {
      name: "Job Knowledge, technical & office equipments skills",
      key: "job_knowledge",
      descriptionKey: "job_description",
      additionalText: "Resourcefulness used in carrying out responsibilities",
    },
    {
      name: "Performance in Meetings deadlines & commitments",
      key: "performance_in_meetings",
      descriptionKey: "performance_description",
      additionalText:
        "Capability of achieving company's goal. It includes his real output of productivity as he is assigned for.",
    },
    {
      name: "Communication Skills",
      key: "communication_skills",
      descriptionKey: "communication_description",
      additionalText:
        "Ability to explain, convince and be understood in oral and written communication with people at all levels.",
    },
    {
      name: "Reliability & Responsibility",
      key: "reliability",
      descriptionKey: "reliability_description",
      additionalText: "Implies the quality to be trustworthy...",
    },
    {
      name: "Initiative & Creativity",
      key: "initiative",
      descriptionKey: "initiative_description",
      additionalText: "Willingness to expand responsibilities...",
    },
    {
      name: "Stress Management & Steadiness under pressure",
      key: "stress_management",
      descriptionKey: "stress_management_description",
      additionalText:
        "Ability to withstand pressure in emergency situations...",
    },
    {
      name: "Co-operation, Team-work & developing others",
      key: "co_operation",
      descriptionKey: "co_operation_description",
      additionalText:
        "Performance or working co-operatively with senior or co-workers...",
    },
    {
      name: "Leadership, problem-solving & decision-making",
      key: "leadership",
      descriptionKey: "leadership_description",
      additionalText:
        "Quality of maintaining enthusiasm, high morale and team spirit among subordinates.",
    },
    {
      name: "Discipline and personal image",
      key: "discipline",
      descriptionKey: "discipline_description",
      additionalText:
        "It should reflect attendance, obediency, self confidence and personality.",
    },
    {
      name: "Ethical Considerations",
      key: "ethical_considerations",
      descriptionKey: "ethical_considerations_description",
      additionalText: "Knowledge of legal compliance...",
    },
  ];
  const printPage = () => {
    // ... (printPage function remains exactly the same)
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
                      flex-direction: column;
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

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex" }}>
        <Sidebars />
      </div>

      <div style={styles.container}>
        <h2 style={styles.title}>Appraisal Details</h2>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div id="printable-area">
            {/* Employee Details Container */}
            <div style={styles.employeeDetailsContainer}>
              <div style={styles.detailsRow}>
                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Employee ID:</strong> {appraisal.employee_id}
                  </div>
                  <div style={styles.detail}>
                    <strong>Designation:</strong> {appraisal.designation}
                  </div>
                  <div style={styles.detail}>
                    <strong>Department:</strong> {appraisal.department_name}
                  </div>
                  <div style={styles.detail}>
                    <strong>Last Promotion Date:</strong>{" "}
                    {appraisal.last_promotion_date}
                  </div>
                </div>

                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Name:</strong> {appraisal.name}
                  </div>
                  <div style={styles.detail}>
                    <strong>Joining Date:</strong> {appraisal.joining_date}
                  </div>
                  <div style={styles.detail}>
                    <strong>Last Increment Date:</strong>{" "}
                    {appraisal.last_increment_date}
                  </div>
                  <div style={styles.detail}>
                    <strong>Last Education:</strong> {appraisal.last_education}
                  </div>
                </div>
              </div>

              <div style={styles.performanceText}>
                <strong>Performance Score:</strong>
                <p>
                  47-50 = A+ | 42-46 = A | 37-41 = B | 32-36 = C | &lt;31 = D
                </p>
              </div>
            </div>
            {/* Performance Rating Standards Container */}
            <div style={styles.performanceContainer}>
              <div style={styles.performanceText}>
                <strong>Performance Rating Standards:</strong>
                <p>
                  5 = Excellent | 4 = Very Good | 3 = Meets Expectation | 2 =
                  Fairly Good | 1 = Below Expectation
                </p>
              </div>

              {/* Performance Categories */}
              <div style={styles.ratingTable}>
                <div style={styles.tableHeader}>
                  <div style={styles.tableColumn}>
                    Performance Rating Standards
                  </div>
                  <div style={styles.tableColumn}>Points</div>
                  <div style={styles.tableColumn}>Comments</div>
                </div>

                {/* Loop through the performance areas */}
                {criteria.map((item, index) => (
                  <div key={index} style={styles.tableRow}>
                    <div style={styles.tableColumn}>
                      <strong>{item.name}</strong>
                      {item.additionalText && (
                        <div style={styles.additionalText}>
                          {item.additionalText}
                        </div>
                      )}
                    </div>

                    {/* Display Points */}
                    <div style={styles.tableColumn}>
                      {appraisal[item.key] !== undefined
                        ? appraisal[item.key]
                        : "N/A"}
                    </div>

                    {/* Display Comments */}
                    <div style={styles.tableColumn}>
                      {appraisal[item.descriptionKey] || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Promotion, Increment, Performance Reward Container */}
            <div style={styles.promotionContainer}>
              <h3 style={styles.subTitle}>
                Recommended for Promotion, Increment, and Performance Reward for
                the following performances:
              </h3>
              <div style={styles.detailsRow}>
                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Promotion Recommended:</strong>
                    <input
                      type="checkbox"
                      checked={appraisal.promotion}
                      readOnly
                    />
                    {appraisal.promotion && (
                      <span style={{ color: "green", marginLeft: "5px" }}>
                        ✓ Recommended
                      </span>
                    )}
                  </div>
                </div>
                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Increment Recommended:</strong>
                    <input
                      type="checkbox"
                      checked={appraisal.increment}
                      readOnly
                    />
                    {appraisal.increment && (
                      <span
                        style={{
                          color: appraisal.increment_approved
                            ? "green"
                            : "orange",
                          marginLeft: "5px",
                        }}
                      >
                        {appraisal.increment_approved
                          ? "✓ Approved"
                          : "✓ Recommended"}
                      </span>
                    )}
                  </div>
                </div>
                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Performance Reward Recommended:</strong>
                    <input
                      type="checkbox"
                      checked={appraisal.performance_reward}
                      readOnly
                    />
                    {appraisal.performance_reward && (
                      <span style={{ color: "green", marginLeft: "5px" }}>
                        ✓ Recommended
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.numberedList}>
              {appraisal.performance && appraisal.performance.trim() !== ""
                ? appraisal.performance.split("\n").map((item, index) => (
                    <div key={index} style={styles.numberedItem}>
                      <span style={styles.number}>{index + 1})</span>
                      <span style={styles.dottedLine}>{item}</span>
                    </div>
                  ))
                : [...Array(5)].map((_, index) => (
                    <div key={index} style={styles.numberedItem}>
                      <span style={styles.number}>{index + 1})</span>
                      <span style={styles.dottedLine}>... ...</span>
                    </div>
                  ))}
            </div>
            <div style={styles.promotionContainer}>
              <h3 style={styles.subTitle}>
                Expected performances after Promotion / increment/performance
                reward :
              </h3>
            </div>
            <div style={styles.numberedList}>
              {appraisal.expected_performance &&
              appraisal.expected_performance.trim() !== ""
                ? appraisal.expected_performance
                    .split("\n")
                    .map((item, index) => (
                      <div key={index} style={styles.numberedItem}>
                        <span style={styles.number}>{index + 1})</span>
                        <span style={styles.dottedLine}>{item}</span>
                      </div>
                    ))
                : [...Array(3)].map((_, index) => (
                    <div key={index} style={styles.numberedItem}>
                      <span style={styles.number}>{index + 1})</span>
                      <span style={styles.dottedLine}>... ...</span>
                    </div>
                  ))}
            </div>
            {/* Salary & Designation Details Container */}
            <div style={styles.promotionContainer}>
              <h3 style={styles.sectionTitle}>Salary & Designation</h3>
              <div style={styles.salaryDesignationContainer}>
                <div style={styles.columnTitle}>
                  <h4>Present</h4>
                  <h4>Proposed</h4>
                </div>

                {/* Salary Row */}
                <div style={styles.row}>
                  <div style={styles.cell}>
                    <label>Present Salary:</label>
                    <div style={styles.value}>{appraisal.present_salary}</div>
                  </div>
                  <div style={styles.cell}>
                    <label>Proposed Salary:</label>
                    <div style={styles.value}>{appraisal.proposed_salary}</div>
                  </div>
                </div>

                <div style={styles.cell}>
                  <label>Proposed Salary Remarks:</label>
                  <div style={styles.value}>{appraisal.salary_text}</div>
                </div>

                {/* Designation Row */}
                <div style={styles.row}>
                  <div style={styles.cell}>
                    <label>Present Designation:</label>
                    <div style={styles.value}>
                      {appraisal.present_designation}
                    </div>
                  </div>
                  <div style={styles.cell}>
                    <label>Proposed Designation:</label>
                    <div style={styles.value}>
                      {appraisal.proposed_designation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.buttonsContainer}>
            <button onClick={() => navigate(-1)} style={styles.goBackButton}>
              Go Back
            </button>
            <button style={styles.buttonPrint} onClick={printPage}>
              🖨️ Print
            </button>

            {/* Show Approve Increment button only if user has permission AND increment is recommended but not approved */}
            {canApproveIncrement() && canApproveThisIncrement() && (
              <button
                onClick={() => handleApprove(appraisal.id)}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#9ca3af" : "green",
                  color: "white",
                  padding: "10px 15px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "16px",
                }}
              >
                {loading ? "Approving..." : "Approve Increment"}
              </button>
            )}

            {/* Show Approve Designation button only if user has permission AND promotion is recommended but not approved */}
            {canApproveIncrement() && canApproveThisDesignation() && (
              <button
                onClick={() => handleApproveDesignation(appraisal.id)}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#9ca3af" : "#0078D4",
                  color: "white",
                  padding: "10px 15px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  marginLeft: "10px",
                }}
              >
                {loading ? "Approving..." : "Approve Designation"}
              </button>
            )}

            {/* Show message if increment is already approved */}
            {appraisal.increment_approved && (
              <div
                style={{
                  padding: "10px 15px",
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                ✅ Increment Approved
              </div>
            )}

            {/* Show message if designation is already approved */}
            {appraisal.designation_approved && (
              <div
                style={{
                  padding: "10px 15px",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginLeft: "10px",
                }}
              >
                ✅ Designation Approved
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle = {
  display: "flex",
  backgroundColor: "#f4f6f9",
  minHeight: "100vh",
};

const styles = {
  container: {
    width: "70%",
    margin: "auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  subTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#0078D4",
    marginBottom: "15px",
  },
  title: {
    textAlign: "center",
    color: "#0078D4",
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "600",
  },
  employeeDetailsContainer: {
    marginBottom: "20px",
    backgroundColor: "#f4f4f4",
    padding: "15px",
    borderRadius: "8px",
  },
  detailsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  detailsColumn: {
    flex: 1,
    padding: "0 15px",
  },
  detail: {
    fontSize: "14px",
    color: "#333",
    padding: "5px 0",
    textAlign: "left",
  },
  performanceText: {
    fontSize: "14px",
    color: "#333",
    marginTop: "10px",
    textAlign: "center",
  },
  performanceContainer: {
    backgroundColor: "#f9f9f9",
    padding: "15px",
    borderRadius: "8px",
  },
  ratingTable: {
    marginTop: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  tableHeader: {
    display: "flex",
    fontWeight: "bold",
    borderBottom: "2px solid #0078D4",
    paddingBottom: "10px",
  },
  tableColumn: {
    flex: 1,
    textAlign: "center",
    padding: "8px",
    fontSize: "14px",
  },
  tableRow: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #ddd",
    padding: "8px 0",
  },
  additionalText: {
    fontSize: "12px",
    color: "#555",
    fontStyle: "italic",
    marginTop: "5px",
  },
  numberedList: {
    marginTop: "20px",
  },
  numberedItem: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: "10px",
  },
  number: {
    fontSize: "16px",
    color: "#0078D4",
    marginRight: "10px",
  },
  dottedLine: {
    flex: 1,
    borderBottom: "1px dotted #0078D4",
  },
  salaryDesignationContainer: {
    display: "grid",
    gridTemplateRows: "auto auto auto",
    gap: "10px",
    marginTop: "10px",
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
  },
  columnTitle: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    marginBottom: "10px",
    width: "55%",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  cell: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  buttonsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#f8f8f8",
    borderRadius: "5px",
    border: "1px solid #e0e0e0",
    gap: "10px",
  },
  goBackButton: {
    backgroundColor: "#e0e0e0",
    color: "#333",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  buttonPrint: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default AppraisalDetails;
