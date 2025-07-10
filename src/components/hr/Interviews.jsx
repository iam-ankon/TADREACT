import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";

const API_URL = "http://119.148.12.1:8000/api/hrms/api/interviews/";

const Interviews = () => {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { id } = useParams();
  const [candidateData, setCandidateData] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const { name, position_for, age, email, phone, reference } =
    location.state || {};
  const [formData, setFormData] = useState({
    name: name || "",
    position_for: position_for || "",
    age: age || "",
    email: email || "",
    phone: phone || "",
    reference: reference || "",
    place: "",
    interview_date: "",
    education: "",
    job_knowledge: "",
    work_experience: "",
    communication: "",
    personality: "",
    potential: "",
    general_knowledge: "",
    assertiveness: "",
    interview_mark: "",
    interview_result: "",
    interview_notes: "",
    current_remuneration: "",
    expected_package: "",
    notice_period_required: "",
    recommendation: "",
    immediate_recruitment: false,
    on_hold: false,
    no_good: false,
    final_selection_remarks: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Calculate interview mark and result
  const calculateInterviewMark = (formData) => {
    let score = 0;
    const fields = [
      "education",
      "job_knowledge",
      "work_experience",
      "communication",
      "personality",
      "potential",
      "general_knowledge",
      "assertiveness",
    ];

    fields.forEach((field) => {
      if (formData[field]) score += parseInt(formData[field]) || 0;
    });

    const interviewMark = Math.min(Math.max(score, 0), 100);
    let interviewResult = "";

    if (interviewMark <= 35) interviewResult = "Poor";
    else if (interviewMark <= 60) interviewResult = "Adequate";
    else if (interviewMark <= 85) interviewResult = "Good";
    else interviewResult = "Outstanding";

    return { interviewMark, interviewResult };
  };

  // Fetch candidate data from URL params or location state
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has("name") || queryParams.has("id")) {
      const candidateId = queryParams.get("id");
      const urlData = {
        id: candidateId,
        name: queryParams.get("name") || "",
        position_for: queryParams.get("position") || "",
        age: queryParams.get("age") || "",
        email: queryParams.get("email") || "",
        phone: queryParams.get("phone") || "",
        reference: queryParams.get("reference") || "",
      };

      setCandidateData(urlData);
      setFormData((prev) => ({
        ...prev,
        ...urlData,
      }));

      if (
        candidateId &&
        (!urlData.name || !urlData.position_for || !urlData.email)
      ) {
        fetchCandidateData(candidateId);
      }

      navigate(location.pathname, { replace: true });
    } else if (location.state) {
      setCandidateData(location.state);
      setFormData((prev) => ({
        ...prev,
        name: location.state.name || "",
        position_for: location.state.position_for || "",
        age: location.state.age || "",
        email: location.state.email || "",
        phone: location.state.phone || "",
        reference: location.state.reference || "",
      }));
    } else if (id) {
      fetchCandidateData(id);
    }
  }, [location, id, navigate]);

  // Fetch candidate data from API
  const fetchCandidateData = async (candidateId) => {
    try {
      const response = await axios.get(
        `http://119.148.12.1:8000/api/hrms/api/CVAdd/${candidateId}/`
      );
      setCandidateData(response.data);
      setFormData((prev) => ({
        ...prev,
        name: response.data.name || "",
        position_for: response.data.position_for || "",
        age: response.data.age || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        reference: response.data.reference || "",
      }));
    } catch (error) {
      console.error("Error fetching candidate data:", error);
      showToast("Failed to fetch candidate data", "error");
    }
  };

  // Show popup when interview mark/result changes
  useEffect(() => {
    if (formData.interview_mark || formData.interview_result) {
      setShowPopup(true);
      const timer = setTimeout(() => setShowPopup(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.interview_mark, formData.interview_result]);

  // Fetch interview data
  useEffect(() => {
    if (location.state?.interview) {
      setSelectedInterview(location.state.interview);
      setFormData(location.state.interview);
    }
  }, [location]);

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: inputValue,
      };

      // Recalculate if it's a scoring field
      const scoreFields = [
        "education",
        "job_knowledge",
        "work_experience",
        "communication",
        "personality",
        "potential",
        "general_knowledge",
        "assertiveness",
      ];

      if (scoreFields.includes(name)) {
        const { interviewMark, interviewResult } =
          calculateInterviewMark(updatedFormData);
        updatedFormData.interview_mark = interviewMark;
        updatedFormData.interview_result = interviewResult;
      }

      return updatedFormData;
    });
  };

  // Fetch all interviews
  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      setInterviews(response.data);
    } catch (error) {
      showToast("Error fetching interviews", "error");
      console.error("Error fetching interviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key] ?? "");
      });

      if (selectedInterview) {
        response = await axios.put(
          `${API_URL}${selectedInterview.id}/`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        showToast("Interview updated successfully", "success");
      } else {
        response = await axios.post(API_URL, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("Interview created successfully", "success");
      }

      fetchInterviews();

      if (!selectedInterview && response.data?.id) {
        navigate(`/interviews?interview_id=${response.data.id}`, {
          replace: true,
        });
      }

      return response.data;
    } catch (error) {
      console.error("Error submitting interview:", error);
      showToast("Error submitting interview", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interview action with confirmation
  const handleInterviewAction = async (e) => {
    e.preventDefault();
    const action = selectedInterview ? "update" : "create";

    if (window.confirm(`Are you sure you want to ${action} this interview?`)) {
      await handleSubmit(e);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setSelectedInterview(null);
    setFormData({
      name: location.state?.name || "",
      position_for: location.state?.position_for || "",
      age: location.state?.age || "",
      email: location.state?.email || "",
      phone: location.state?.phone || "",
      reference: location.state?.reference || "",
      place: "",
      interview_date: "",
      education: "",
      job_knowledge: "",
      work_experience: "",
      communication: "",
      personality: "",
      potential: "",
      general_knowledge: "",
      assertiveness: "",
      interview_mark: "",
      interview_result: "",
      interview_notes: "",
      current_remuneration: "",
      expected_package: "",
      notice_period_required: "",
      recommendation: "",
      immediate_recruitment: false,
      on_hold: false,
      no_good: false,
      final_selection_remarks: "",
    });
  };

  // Delete interview
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        showToast("Interview deleted successfully", "success");
        fetchInterviews();
        resetForm();
      } catch (error) {
        showToast("Error deleting interview", "error");
      }
    }
  };

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Print single interview
  const printInterview = (interview) => {
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
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              padding: 3px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
              color: #777;
            }
            .final-selection {
              margin-top: 15px;
              padding: 10px;
              border: 1px solid #333;
              background-color: #f1f1f1;
              text-align: center;
              font-weight: bold;
            }
            .signature-container {
              margin-top: 20px;
              border: 1px solid #333;
              padding: 10px;
              background-color: #f1f1f1;
              page-break-inside: avoid;
            }
            .spacer {
              height: 0.8in; /* Creates a 1-inch vertical gap */
            }

            .signature-box {
              height: 50px;
              width: 200px;
              border: 1px solid #999;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${interview.name}'s Interview</h2>
  
            <div class="details-container">
              <div class="details-item"><span class="label">Position:</span> ${
                interview.position_for
              }</div>
              <div class="details-item"><span class="label">Date of Birth:</span> ${
                interview.age
              }</div>
              <div class="details-item"><span class="label">Reference:</span> ${
                interview.reference
              }</div>
              <div class="details-item"><span class="label">Email:</span> ${
                interview.email
              }</div>
              <div class="details-item"><span class="label">Phone:</span> ${
                interview.phone
              }</div>
              <div class="details-item"><span class="label">Interview Date:</span> ${new Date(
                interview.interview_date
              ).toLocaleString()}</div>
              <div class="details-item"><span class="label">Place:</span> ${
                interview.place
              }</div>
            </div>
  
            <div class="vertical-container">
              <div class="item"><span class="label">Current Remuneration:</span> ${
                interview.current_remuneration
              }</div>
              <div class="item"><span class="label">Expected Package:</span> ${
                interview.expected_package
              }</div>
              <div class="item"><span class="label">Notice Period Required:</span> ${
                interview.notice_period_required
              }</div>
            </div>
  
            <div class="vertical-container">
              <div class="item"><span class="label">Education:</span> ${
                interview.education
              }</div>
              <div class="value">Qualification, special courses & training, projects, reports, surveys, technical knowledge, etc.</div>
              
              <div class="item"><span class="label">Job Knowledge:</span> ${
                interview.job_knowledge
              }</div>
              <div class="value">Technical capability, in-depth knowledge, know-how, etc.</div>
              
              <div class="item"><span class="label">Work Experience:</span> ${
                interview.work_experience
              }</div>
              <div class="value">With special reference to the function for which they are being interviewed.</div>
              
              <div class="item"><span class="label">Communication:</span> ${
                interview.communication
              }</div>
              <div class="value">Language, speech, flexibility, smartness, punctuation, etc.</div>
              
              <div class="item"><span class="label">Personality:</span> ${
                interview.personality
              }</div>
              <div class="value">Impression created regarding administrative/leadership/communication skills, look, dress sense, etc.</div>
              
              <div class="item"><span class="label">Potential:</span> ${
                interview.potential
              }</div>
              <div class="value">Ambition, enthusiasm, attitude, motivation, initiative, career growth potential.</div>
              
              <div class="item"><span class="label">General Knowledge:</span> ${
                interview.general_knowledge
              }</div>
              <div class="value">Interests, hobbies, reading, computer skills, etc.</div>
              
              <div class="item"><span class="label">Assertiveness:</span> ${
                interview.assertiveness
              }</div>
              <div class="value">Positive approach, smoothness, flexibility, etc.</div>
            </div>
  
            <div class="vertical-container">
              <div class="item"><span class="label">Interview Mark:</span> ${
                interview.interview_mark
              }</div>
              <div class="item"><span class="label">Result:</span> ${
                interview.interview_result
              }</div>
            </div>
  
            <div class="vertical-container">
              <div class="item"><span class="label">Recommendation:</span> ${
                interview.recommendation
              }</div>
              <div class="item"><span class="label">Immediate Recruitment:</span> ${
                interview.immediate_recruitment ? "Yes" : "No"
              }</div>
              <div class="item"><span class="label">On Hold:</span> ${
                interview.on_hold ? "Yes" : "No"
              }</div>
              <div class="item"><span class="label">No Good:</span> ${
                interview.no_good ? "Yes" : "No"
              }</div>
              <div class="item"><span class="label">MD Sir Notes:</span> ${
                interview.interview_notes || "No notes available"
              }</div>
            </div>
  
            <!-- Final Selection Remarks Section -->
            
  
            <!-- Signature Section -->
            <div class="signature-container">
              <div class="item">
                <span class="label">Final Selection Remarks:</span> ${
                  interview.final_selection_remarks || "No remarks provided"
                }
              </div>
              <div class="spacer"></div> <!-- 1-inch gap -->
              <div class="item">
                <div class="signature-box"></div> <!-- Signature box above text -->
                <span class="label">Interviewer's Signature:</span>
              </div>
            </div>
            <div class="footer">
              <p>Interview details printed by the HR system</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "_blank");
    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
  };
  // Print all interviews
  const printAllInterviews = () => {
    const printWindow = window.open(
      "",
      "Print All Interviews",
      "width=800,height=800"
    );
    let allInterviewsContent = `
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
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              padding: 3px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
              color: #777;
            }
            .final-selection {
              margin-top: 15px;
              padding: 10px;
              border: 1px solid #333;
              background-color: #f1f1f1;
              text-align: center;
              font-weight: bold;
            }
            .signature-container {
              margin-top: 20px;
              border: 1px solid #333;
              padding: 10px;
              background-color: #f1f1f1;
              page-break-inside: avoid;
            }
            .spacer {
              height: 0.8in;
            }
            .signature-box {
              height: 50px;
              width: 200px;
              border: 1px solid #999;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>All Interviews</h2>
    `;

    // Loop through each interview and add their details
    interviews.forEach((interview) => {
      allInterviewsContent += `
        <h2>${interview.name}'s Interview</h2>
        <div class="details-container">
          <div class="details-item"><span class="label">Position:</span> ${
            interview.position_for
          }</div>
          <div class="details-item"><span class="label">Date of Birth:</span> ${
            interview.age
          }</div>
          <div class="details-item"><span class="label">Reference:</span> ${
            interview.reference
          }</div>
          <div class="details-item"><span class="label">Email:</span> ${
            interview.email
          }</div>
          <div class="details-item"><span class="label">Phone:</span> ${
            interview.phone
          }</div>
          <div class="details-item"><span class="label">Interview Date:</span> ${new Date(
            interview.interview_date
          ).toLocaleString()}</div>
          <div class="details-item"><span class="label">Place:</span> ${
            interview.place
          }</div>
        </div>
  
        <div class="vertical-container">
          <div class="item"><span class="label">Current Remuneration:</span> ${
            interview.current_remuneration
          }</div>
          <div class="item"><span class="label">Expected Package:</span> ${
            interview.expected_package
          }</div>
          <div class="item"><span class="label">Notice Period Required:</span> ${
            interview.notice_period_required
          }</div>
        </div>
  
        <div class="vertical-container">
          <div class="item"><span class="label">Education:</span> ${
            interview.education
          }</div>
          <div class="value">Qualification, special courses & training, projects, reports, surveys, technical knowledge, etc.</div>
          
          <div class="item"><span class="label">Job Knowledge:</span> ${
            interview.job_knowledge
          }</div>
          <div class="value">Technical capability, in-depth knowledge, know-how, etc.</div>
          
          <div class="item"><span class="label">Work Experience:</span> ${
            interview.work_experience
          }</div>
          <div class="value">With special reference to the function for which they are being interviewed.</div>
          
          <div class="item"><span class="label">Communication:</span> ${
            interview.communication
          }</div>
          <div class="value">Language, speech, flexibility, smartness, punctuation, etc.</div>
          
          <div class="item"><span class="label">Personality:</span> ${
            interview.personality
          }</div>
          <div class="value">Impression created regarding administrative/leadership/communication skills, look, dress sense, etc.</div>
          
          <div class="item"><span class="label">Potential:</span> ${
            interview.potential
          }</div>
          <div class="value">Ambition, enthusiasm, attitude, motivation, initiative, career growth potential.</div>
          
          <div class="item"><span class="label">General Knowledge:</span> ${
            interview.general_knowledge
          }</div>
          <div class="value">Interests, hobbies, reading, computer skills, etc.</div>
          
          <div class="item"><span class="label">Assertiveness:</span> ${
            interview.assertiveness
          }</div>
          <div class="value">Positive approach, smoothness, flexibility, etc.</div>
        </div>
  
        <div class="vertical-container">
          <div class="item"><span class="label">Interview Mark:</span> ${
            interview.interview_mark
          }</div>
          <div class="item"><span class="label">Result:</span> ${
            interview.interview_result
          }</div>
        </div>
  
        <div class="vertical-container">
          <div class="item"><span class="label">Recommendation:</span> ${
            interview.recommendation
          }</div>
          <div class="item"><span class="label">Immediate Recruitment:</span> ${
            interview.immediate_recruitment ? "Yes" : "No"
          }</div>
          <div class="item"><span class="label">On Hold:</span> ${
            interview.on_hold ? "Yes" : "No"
          }</div>
          <div class="item"><span class="label">No Good:</span> ${
            interview.no_good ? "Yes" : "No"
          }</div>
          <div class="item"><span class="label">MD Sir Notes:</span> ${
            interview.interview_notes || "No notes available"
          }</div>
        </div>
  
        <div class="signature-container">
          <div class="item">
            <span class="label">Final Selection Remarks:</span> ${
              interview.final_selection_remarks || "No remarks provided"
            }
          </div>
          <div class="spacer"></div>
          <div class="item">
            <div class="signature-box"></div>
            <span class="label">Interviewer's Signature:</span>
          </div>
        </div>
        <hr />
      `;
    });

    allInterviewsContent += `
      <div class="footer">
        <p>Interview details printed by the HR system</p>
      </div>
    </body>
  </html>
  `;

    printWindow.document.write(allInterviewsContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Action buttons handlers
  const handleSendMail = (interview) =>
    navigate("/mailmdsir", { state: interview });
  const handleInviteMail = (interview) =>
    navigate("/invitemail", { state: interview });
  const handleLetterSend = (interview) =>
    navigate("/add-letter", { state: interview });
  const handleSelectedAsEmployee = (interview) =>
    navigate("/add-employee", { state: interview });

  // Styles
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#DCEEF3",
    },
    sidebar: {
      width: "280px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
    },
    sidebarHeader: {
      fontSize: "20px",
      marginBottom: "20px",
    },
    searchInput: {
      width: "100%",
      padding: "10px",
      marginBottom: "20px",
      border: "none",
      borderRadius: "4px",

      color: "white",
      outline: "none",
    },
    button: {
      padding: "10px",
      marginBottom: "10px",
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    buttonHover: {
      backgroundColor: "#2980b9",
    },
    buttonPrint: {
      backgroundColor: "#27ae60",
    },
    buttonDanger: {
      backgroundColor: "#e74c3c",
    },
    interviewItem: {
      padding: "12px",
      marginBottom: "8px",
      // backgroundColor: "#34495e",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.3s",
    },
    interviewItemActive: {
      backgroundColor: "#3498db",
    },
    content: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
      backgroundColor: "white",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "15px",
      color: "#2c3e50",
      borderBottom: "1px solid #eee",
      paddingBottom: "10px",
    },
    formRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "20px",
      marginBottom: "15px",
      
    },
    formGroup: {
      flex: "1 1 200px",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "500",
      color: "#34495e",
    },
    input: {
      width: "100%",
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
    },
    textarea: {
      width: "100%",
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      minHeight: "100px",
      resize: "vertical",
    },
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      marginRight: "15px",
    },
    checkbox: {
      marginRight: "8px",
    },
    actionButtons: {
      display: "flex",
      marginTop: "20px",
      padding: "10px 0",
      gap: "10px",
    },
    tabContainer: {
      display: "flex",
      borderBottom: "1px solid #ddd",
      marginBottom: "20px",
    },
    tab: {
      padding: "10px 20px",
      cursor: "pointer",
      borderBottom: "2px solid transparent",
    },
    tabActive: {
      borderBottom: "2px solid #3498db",
      color: "#3498db",
      fontWeight: "500",
    },
    toast: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px 20px",
      borderRadius: "4px",
      color: "white",
      boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
      zIndex: 1000,
    },
    toastSuccess: {
      backgroundColor: "#27ae60",
    },
    toastError: {
      backgroundColor: "#e74c3c",
    },
    scoreInput: {
      width: "60px",
      textAlign: "center",
    },
    scoreContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      justifyContent: "space-between",
    },
    scoreLabel: {
      minWidth: "150px",
    },
    resultBadge: {
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold",
    },
    resultPoor: {
      backgroundColor: "#e74c3c",
      color: "white",
    },
    resultAdequate: {
      backgroundColor: "#f39c12",
      color: "white",
    },
    resultGood: {
      backgroundColor: "#3498db",
      color: "white",
    },
    resultOutstanding: {
      backgroundColor: "#27ae60",
      color: "white",
    },
    loading: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100px",
    },
  };

  // Get result badge style based on interview result
  const getResultBadgeStyle = (result) => {
    switch (result) {
      case "Poor":
        return { ...styles.resultBadge, ...styles.resultPoor };
      case "Adequate":
        return { ...styles.resultBadge, ...styles.resultAdequate };
      case "Good":
        return { ...styles.resultBadge, ...styles.resultGood };
      case "Outstanding":
        return { ...styles.resultBadge, ...styles.resultOutstanding };
      default:
        return styles.resultBadge;
    }
  };

  // Fetch interviews on component mount
  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebars />
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2>Interviews</h2>
        </div>

        <input
          type="text"
          placeholder="Search candidates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <button style={styles.button} onClick={resetForm}>
          + Create New Interview
        </button>

        <button
          style={{ ...styles.button, ...styles.buttonPrint }}
          onClick={printAllInterviews}
          disabled={interviews.length === 0}
        >
          🖨️ Print All Interviews
        </button>

        <div style={{ maxHeight: "calc(80vh - 200px)", overflowY: "auto" }}>
          {isLoading ? (
            <div style={styles.loading}>Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div
              style={{ color: "#bdc3c7", textAlign: "center", padding: "20px" }}
            >
              No interviews found
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {interviews
                .filter((interview) =>
                  interview.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((interview) => (
                  <li
                    key={interview.id}
                    style={{
                      ...styles.interviewItem,
                      ...(selectedInterview?.id === interview.id &&
                        styles.interviewItemActive),
                    }}
                    onClick={() => {
                      setSelectedInterview(interview);
                      setFormData({
                        ...interview,
                        interview_date: interview.interview_date
                          ? new Date(interview.interview_date)
                              .toISOString()
                              .slice(0, 16)
                          : "",
                      });

                      setActiveTab("details");
                    }}
                  >
                    <div style={{ fontWeight: "500" }}>{interview.name}</div>
                    <div style={{ fontSize: "12px", marginTop: "5px" }}>
                      {interview.position_for}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "5px",
                      }}
                    >
                      <span>
                        {new Date(
                          interview.interview_date
                        ).toLocaleDateString()}
                      </span>
                      <span
                        style={getResultBadgeStyle(interview.interview_result)}
                      >
                        {interview.interview_result}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          {toast && (
            <div
              style={{
                ...styles.toast,
                ...(toast.type === "error"
                  ? styles.toastError
                  : styles.toastSuccess),
              }}
            >
              {toast.message}
            </div>
          )}

          {selectedInterview ? (
            <div>
              {/* Tabs */}
              <div style={styles.tabContainer}>
                <div
                  style={{
                    ...styles.tab,
                    ...(activeTab === "details" && styles.tabActive),
                  }}
                  onClick={() => setActiveTab("details")}
                >
                  Interview Details
                </div>
                <div
                  style={{
                    ...styles.tab,
                    ...(activeTab === "edit" && styles.tabActive),
                  }}
                  onClick={() => setActiveTab("edit")}
                >
                  Edit Interview
                </div>
              </div>

              {activeTab === "details" ? (
                <div>
                  <div style={styles.card}>
                    <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>
                      {selectedInterview.name}'s Interview
                    </h2>

                    <div style={styles.sectionTitle}>Candidate Information</div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Position</span>
                        <div>{selectedInterview.position_for}</div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Date of Birth</span>
                        <div>{selectedInterview.age}</div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Email</span>
                        <div>{selectedInterview.email}</div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Phone</span>
                        <div>{selectedInterview.phone}</div>
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Interview Date</span>
                        <div>
                          {new Date(
                            selectedInterview.interview_date
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Place</span>
                        <div>{selectedInterview.place}</div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Reference</span>
                        <div>{selectedInterview.reference}</div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.sectionTitle}>Evaluation</div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Interview Score</span>
                        <div>{selectedInterview.interview_mark}</div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Result</span>
                        <div
                          style={getResultBadgeStyle(
                            selectedInterview.interview_result
                          )}
                        >
                          {selectedInterview.interview_result}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <span style={styles.label}>Evaluation Criteria</span>
                      <div style={{ marginTop: "10px" }}>
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Education</span>
                            <div>{selectedInterview.education}/20</div>
                          </div>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Job Knowledge</span>
                            <div>{selectedInterview.job_knowledge}/20</div>
                          </div>
                        </div>
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Work Experience</span>
                            <div>{selectedInterview.work_experience}/10</div>
                          </div>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Communication</span>
                            <div>{selectedInterview.communication}/10</div>
                          </div>
                        </div>
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Personality</span>
                            <div>{selectedInterview.personality}/10</div>
                          </div>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Potential</span>
                            <div>{selectedInterview.potential}/10</div>
                          </div>
                        </div>
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>General Knowledge</span>
                            <div>{selectedInterview.general_knowledge}/10</div>
                          </div>
                          <div style={styles.formGroup}>
                            <span style={styles.label}>Assertiveness</span>
                            <div>{selectedInterview.assertiveness}/10</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.sectionTitle}>Decision & Notes</div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Recommendation</span>
                        <div>{selectedInterview.recommendation || "N/A"}</div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Status</span>
                        <div>
                          {selectedInterview.immediate_recruitment
                            ? "Immediate Recruitment"
                            : selectedInterview.on_hold
                            ? "On Hold"
                            : selectedInterview.no_good
                            ? "No Good"
                            : "Pending"}
                        </div>
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Current Remuneration</span>
                        <div>
                          {selectedInterview.current_remuneration || "N/A"}
                        </div>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Expected Package</span>
                        <div>{selectedInterview.expected_package || "N/A"}</div>
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <span style={styles.label}>Notice Period Required</span>
                        <div>
                          {selectedInterview.notice_period_required || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "15px" }}>
                      <span style={styles.label}>Interview Notes</span>
                      <div
                        style={{
                          padding: "10px",
                          border: "1px solid #eee",
                          borderRadius: "4px",
                          minHeight: "50px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        {selectedInterview.interview_notes ||
                          "No notes available"}
                      </div>
                    </div>

                    <div style={{ marginTop: "15px" }}>
                      <span style={styles.label}>Final Selection Remarks</span>
                      <div
                        style={{
                          padding: "10px",
                          border: "1px solid #eee",
                          borderRadius: "4px",
                          minHeight: "50px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        {selectedInterview.final_selection_remarks ||
                          "No remarks provided"}
                      </div>
                    </div>
                  </div>

                  <div style={styles.actionButtons}>
                    <button
                      style={{ ...styles.button, ...styles.buttonPrint }}
                      onClick={() => printInterview(selectedInterview)}
                    >
                      Print Interview
                    </button>
                    <button
                      style={{ ...styles.button, backgroundColor: "#9b59b6" }}
                      onClick={() => handleInviteMail(selectedInterview)}
                    >
                      Invite for Interview
                    </button>
                    <button
                      style={{
                        ...styles.button,
                        backgroundColor: "#f39c12",
                        color: "white",
                      }}
                      onClick={() => handleSendMail(selectedInterview)}
                    >
                      Send to MD Sir
                    </button>
                    <button
                      style={{ ...styles.button, backgroundColor: "#1abc9c" }}
                      onClick={() => handleLetterSend(selectedInterview)}
                    >
                      Send Offer Letter
                    </button>
                    <button
                      style={{ ...styles.button, backgroundColor: "#27ae60" }}
                      onClick={() =>
                        handleSelectedAsEmployee(selectedInterview)
                      }
                    >
                      Create Employee
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.buttonDanger }}
                      onClick={() => handleDelete(selectedInterview.id)}
                    >
                      Delete Interview
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <form onSubmit={handleInterviewAction}>
                    <div style={styles.card}>
                      <div style={styles.sectionTitle}>
                        Candidate Information
                      </div>
                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Position</label>
                          <input
                            type="text"
                            name="position_for"
                            value={formData.position_for}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Date of Birth</label>
                          <input
                            type="date"
                            name="age"
                            value={formData.age}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Reference</label>
                          <input
                            type="text"
                            name="reference"
                            value={formData.reference}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Interview Date</label>
                          <input
                            type="datetime-local"
                            name="interview_date"
                            value={formData.interview_date}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Place</label>
                          <input
                            type="text"
                            name="place"
                            value={formData.place}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.card}>
                      <div style={styles.sectionTitle}>Evaluation Criteria</div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Education (Max 20)
                            </label>
                            <input
                              type="number"
                              name="education"
                              value={formData.education}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="20"
                            />
                          </div>
                        </div>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Job Knowledge (Max 20)
                            </label>
                            <input
                              type="number"
                              name="job_knowledge"
                              value={formData.job_knowledge}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="20"
                            />
                          </div>
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Work Experience (Max 10)
                            </label>
                            <input
                              type="number"
                              name="work_experience"
                              value={formData.work_experience}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Communication (Max 10)
                            </label>
                            <input
                              type="number"
                              name="communication"
                              value={formData.communication}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Personality (Max 10)
                            </label>
                            <input
                              type="number"
                              name="personality"
                              value={formData.personality}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Potential (Max 10)
                            </label>
                            <input
                              type="number"
                              name="potential"
                              value={formData.potential}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              General Knowledge (Max 10)
                            </label>
                            <input
                              type="number"
                              name="general_knowledge"
                              value={formData.general_knowledge}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                        <div style={styles.formGroup}>
                          <div style={styles.scoreContainer}>
                            <label style={styles.scoreLabel}>
                              Assertiveness (Max 10)
                            </label>
                            <input
                              type="number"
                              name="assertiveness"
                              value={formData.assertiveness}
                              onChange={handleInputChange}
                              style={styles.scoreInput}
                              min="0"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Interview Score</label>
                            <input
                              type="text"
                              value={formData.interview_mark}
                              style={styles.input}
                              readOnly
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Interview Result</label>
                            <input
                              type="text"
                              value={formData.interview_result}
                              style={styles.input}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.card}>
                      <div style={styles.sectionTitle}>
                        Compensation & Decision
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>
                            Current Remuneration
                          </label>
                          <input
                            type="text"
                            name="current_remuneration"
                            value={formData.current_remuneration}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Expected Package</label>
                          <input
                            type="text"
                            name="expected_package"
                            value={formData.expected_package}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>
                            Notice Period Required
                          </label>
                          <input
                            type="text"
                            name="notice_period_required"
                            value={formData.notice_period_required}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Recommendation</label>
                          <input
                            type="text"
                            name="recommendation"
                            value={formData.recommendation}
                            onChange={handleInputChange}
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "15px" }}>
                        <label style={styles.label}>Status</label>
                        <div
                          style={{
                            display: "flex",
                            gap: "20px",
                            marginTop: "10px",
                          }}
                        >
                          <label style={styles.checkboxGroup}>
                            <input
                              type="checkbox"
                              name="immediate_recruitment"
                              checked={formData.immediate_recruitment}
                              onChange={handleInputChange}
                              style={styles.checkbox}
                            />
                            Immediate Recruitment
                          </label>
                          <label style={styles.checkboxGroup}>
                            <input
                              type="checkbox"
                              name="on_hold"
                              checked={formData.on_hold}
                              onChange={handleInputChange}
                              style={styles.checkbox}
                            />
                            On Hold
                          </label>
                          <label style={styles.checkboxGroup}>
                            <input
                              type="checkbox"
                              name="no_good"
                              checked={formData.no_good}
                              onChange={handleInputChange}
                              style={styles.checkbox}
                            />
                            No Good
                          </label>
                        </div>
                      </div>

                      <div style={{ marginTop: "15px" }}>
                        <label style={styles.label}>Interview Notes</label>
                        <textarea
                          name="interview_notes"
                          value={formData.interview_notes}
                          onChange={handleInputChange}
                          style={styles.textarea}
                        />
                      </div>

                      <div style={{ marginTop: "15px" }}>
                        <label style={styles.label}>
                          Final Selection Remarks
                        </label>
                        <textarea
                          name="final_selection_remarks"
                          value={formData.final_selection_remarks}
                          onChange={handleInputChange}
                          style={styles.textarea}
                        />
                      </div>
                    </div>
                  </form>
                  <div style={styles.actionButtons}>
                    <button
                      type="submit"
                      style={{
                        ...styles.button,
                        ...(isLoading ? { opacity: 0.7 } : {}),
                      }}
                      disabled={isLoading}
                      onClick={handleInterviewAction}
                    >
                      {isLoading
                        ? "Processing..."
                        : selectedInterview
                        ? "Update Interview"
                        : "Create Interview"}
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: "#95a5a6" }}
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 style={{ marginBottom: "20px" }}>Create New Interview</h2>

              <form onSubmit={handleInterviewAction}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>Candidate Information</div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Position</label>
                      <input
                        type="text"
                        name="position_for"
                        value={formData.position_for}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Date of Birth</label>
                      <input
                        type="date"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Reference</label>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Interview Date</label>
                      <input
                        type="datetime-local"
                        name="interview_date"
                        value={formData.interview_date}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Place</label>
                      <input
                        type="text"
                        name="place"
                        value={formData.place}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              </form>
              <div style={styles.actionButtons}>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    ...(isLoading ? { opacity: 0.7 } : {}),
                  }}
                  disabled={isLoading}
                  onClick={handleInterviewAction}
                >
                  {isLoading ? "Processing..." : "Create Interview"}
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, backgroundColor: "#95a5a6" }}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Popup */}
        {showPopup && (
          <div
            style={{
              position: "fixed",
              top: "100px",
              right: "50px",
              padding: "15px 20px",
              backgroundColor: "#27ae60",
              color: "white",
              borderRadius: "4px",
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>✓</span>
            <div>
              <div style={{ fontWeight: "bold" }}>Interview Evaluated</div>
              <div>
                Score: {formData.interview_mark} - {formData.interview_result}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;
