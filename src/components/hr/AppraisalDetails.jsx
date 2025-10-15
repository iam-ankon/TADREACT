import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

const AppraisalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState(null);
  const username = localStorage.getItem("username");
  // const [employee, setEmployee] = useState(null); // initialize state
  // const [incrementHistory, setIncrementHistory] = useState([]);

  const handleApprove = (appraisalId) => {
    axios
      .post(
        `http://119.148.51.38:8000/api/hrms/api/performanse_appraisals/${appraisalId}/approve_increment/`
      )
      .then(() => {
        alert("Increment approved successfully");
        axios
          .get(
            `http://119.148.51.38:8000/api/hrms/api/performanse_appraisals/${appraisalId}/`
          )
          .then((res) => setAppraisal(res.data));
      })
      .catch((err) => console.error("Error approving increment", err));
  };

  useEffect(() => {
    axios
      .get(
        `http://119.148.51.38:8000/api/hrms/api/performanse_appraisals/${id}/`
      )
      .then((res) => setAppraisal(res.data))
      .catch((err) => console.error("Error fetching data:", err));
  }, [id]);

  if (!appraisal) return <p>Loading...</p>;
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
                        grid-template-columns: 70% 15% auto; /* Change 45% to auto */
                        align-items: start;
                        gap: 5px;
                        margin-bottom: 3px;
                        padding: 3px;
                      }
                      .final-selection {
                      display: flex;
                      gap: 20px; /* Adds space between the checkboxes */
                      align-items: center; /* Vertically centers the checkboxes */
                      }
                      .recommended-text {
                          margin-top: 10px; /* Adds space between checkboxes and "for the following performances" text */
                          font-style: italic; /* Makes the text italic for emphasis */
                          color: #555; /* Lightens the text color */
                      }
                      .performances-text {
                          margin-top: 10px; /* Adds space between checkboxes and "for the following performances" text */
                          font-style: italic; /* Makes the text italic for emphasis */
                          color: #555; /* Lightens the text color */
                      }
                      .iteme {
                      display: flex;
                      align-items: center; /* Aligns label and checkbox horizontally */
                      }
      
                      .label {
                      margin-right: 10px; /* Adds space between the label and checkbox */
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
                          grid-template-columns: 70% 15% 15%; /* This keeps the three columns in place */
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
                          grid-column: 1 / 3; /* Makes it span from the first to the second column */
                          padding-left: 10px;
                      }
      
                      .item .value {
                          font-size: 12px;
                      }
      
      
                      .salary-designation-columns {
                      display: flex;
                      justify-content: space-between; /* Distributes the columns evenly */
                      gap: 20px;
                      }
      
                      .column {
                      display: flex;
                      flex-direction: column;
                      gap: 10px;
                      flex: 1; /* Ensures all columns take equal width */
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
                      width: 23%; /* Adjusts the width to fit 4 columns */
                      }
      
                      .signature-label {
                      font-weight: bold;
                      margin-top: 5px; /* Adds space between the line and the label */
                      }
      
                      .signature-line {
                      width: 100%;
                      border-bottom: 1px solid #000;
                      margin-bottom: 5px; /* Adds space between the line and the label */
                      }
      
                      .vertical-container .item .value {
                        word-wrap: break-word; /* Ensures long words wrap */
                        overflow-wrap: break-word; /* Alternative for older browsers */
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
                {[
                  {
                    name: "Job Knowledge, technical & office equipments skills",
                    key: "job_knowledge",
                    additionalText:
                      "Resourcefulness used in carrying out responsibilities",
                  },
                  {
                    name: "Performance in Meetings deadlines & commitments",
                    key: "performance_in_meetings",
                    additionalText:
                      "Capability of achieving company's goal. It includes his real output of productivity as he is assigned for.",
                  },
                  {
                    name: "Communication Skills",
                    key: "communication_skills",
                    additionalText:
                      "Ability to explain, convince and be understood in oral and written communication with people at all levels.",
                  },
                  {
                    name: "Reliability & Responsibility",
                    key: "reliability",
                    additionalText:
                      "Implies the quality to be trustworthy. This includes employee’s ability to be punctual, work overtime willingly, maintain confidentiality of important documents and be available whenever required.",
                  },
                  {
                    name: "Initiative & Creativity",
                    key: "initiative",
                    additionalText:
                      "Willingness to expand responsibilities. It includes motivation willingness to be self-directed and work without supervision",
                  },
                  {
                    name: "Stress Management & Steadiness under pressure",
                    key: "stress_management",
                    additionalText:
                      "Ability to withstand pressure in emergency situations. This includes ability to meet deadlines when under pressure and how an employee deals with frustration and conflicts in time of crisis.",
                  },
                  {
                    name: "Co-operation, Team-work & developing others",
                    key: "co_operation",
                    additionalText:
                      "Performance or working co-operatively with senior or co-workers. It includes demonstrations of willingness to work jointly and respond positively to requests made of peer and superiors.",
                  },
                  {
                    name: "Leadership, problem-solving & decision-making",
                    key: "leadership",
                    additionalText:
                      "Quality of maintaining enthusiasm, high morale and team spirit among subordinates.",
                  },
                  {
                    name: "Discipline and personal image",
                    key: "discipline",
                    additionalText:
                      "It should reflect attendance, obediency, self confidence and personality.",
                  },
                  {
                    name: "Ethical Considerations",
                    key: "ethical_considerations",
                    additionalText:
                      "Knowledge of legal compliance and implementation and carrying out the same in workplace",
                  },
                ].map((item, index) => (
                  <div key={index} style={styles.tableRow}>
                    <div style={styles.tableColumn}>
                      {/* Display Bold Text for Job Knowledge and additional text if provided */}
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

                    {/* Display Comments (if available, assuming there's a comment field) */}
                    <div style={styles.tableColumn}>
                      {item.key === "job_knowledge" && appraisal.job_description
                        ? appraisal.job_description
                        : item.key === "performance_in_meetings" &&
                          appraisal.performance_description
                        ? appraisal.performance_description
                        : item.key === "communication_skills" &&
                          appraisal.communication_description
                        ? appraisal.communication_description
                        : item.key === "reliability" &&
                          appraisal.reliability_description
                        ? appraisal.reliability_description
                        : item.key === "initiative" &&
                          appraisal.initiative_description
                        ? appraisal.initiative_description
                        : item.key === "stress_management" &&
                          appraisal.stress_management_description
                        ? appraisal.stress_management_description
                        : item.key === "co_operation" &&
                          appraisal.co_operation_description
                        ? appraisal.co_operation_description
                        : item.key === "leadership" &&
                          appraisal.leadership_description
                        ? appraisal.leadership_description
                        : item.key === "discipline" &&
                          appraisal.discipline_description
                        ? appraisal.discipline_description
                        : item.key === "ethical_considerations" &&
                          appraisal.ethical_considerations_description
                        ? appraisal.ethical_considerations_description
                        : "N/A"}
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
                    <strong>Promotion:</strong>
                    <input
                      type="checkbox"
                      checked={appraisal.promotion}
                      readOnly
                    />
                  </div>
                </div>
                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Increment:</strong>
                    <input
                      type="checkbox"
                      checked={appraisal.increment}
                      readOnly
                    />
                  </div>
                </div>
                <div style={styles.detailsColumn}>
                  <div style={styles.detail}>
                    <strong>Performance Reward:</strong>
                    <input
                      type="checkbox"
                      checked={appraisal.performance_reward}
                      readOnly
                    />
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
              {/* Salary & Designation Grid */}
              <h3 style={styles.sectionTitle}>Salary & Designation</h3>
              <div style={styles.salaryDesignationContainer}>
                {/* Column Titles */}
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

            {username === "Tuhin" && (
              <button
                onClick={() => handleApprove(appraisal.id)} // ✅ FIXED
                disabled={appraisal.increment} // Disable if already approved
                style={{
                  backgroundColor: "green",
                  color: "white",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Approve Increment
              </button>
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
    fontWeight: "bold", // Make text bold
    color: "#0078D4", // Set the color to blue
    marginBottom: "15px", // Space below the subtitle
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
    color: "#0078D4", // Blue color for numbers
    marginRight: "10px",
  },
  dottedLine: {
    flex: 1,
    borderBottom: "1px dotted #0078D4", // Blue dotted line
  },
  salaryDesignationContainer: {
    display: "grid",
    gridTemplateRows: "auto auto auto", // Title row + 2 input rows
    gap: "10px",
    marginTop: "10px",
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
  },
  columnTitle: {
    display: "flex",
    justifyContent: "space-between", // This creates space between the items
    fontWeight: "bold",
    marginBottom: "10px",
    width: "55%", // Ensure the container takes full width
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

  submitButton: {
    marginTop: "20px",
    padding: "10px",
    background: "#0078D4",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    marginleft: "20px",
  },
  printButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    cursor: "pointer",
    marginTop: "20px",
    marginr: "20px",
  },
  buttonsContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px", // Add some space above the buttons
    padding: "10px",
    backgroundColor: "#f8f8f8", // Light background for the button container
    borderRadius: "5px", // Rounded corners for the container
    border: "1px solid #e0e0e0", // Light border
  },
  goBackButton: {
    backgroundColor: "#e0e0e0", // Light gray background
    color: "#333", // Dark text color
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease", // Smooth transition for hover effect
    ":hover": {
      backgroundColor: "#d0d0d0", // Darker gray on hover
    },
  },
  buttonPrint: {
    backgroundColor: "#4CAF50", // Green background
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
    ":hover": {
      backgroundColor: "#45a049", // Darker green on hover
    },
  },
};

export default AppraisalDetails;
