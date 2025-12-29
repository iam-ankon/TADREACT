import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { 
  FaArrowDown, 
  FaPrint, 
  FaTrash, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaUserPlus, 
  FaEnvelope, 
  FaFileAlt,
  FaCheckCircle,
  FaSearch,
  FaCalendarAlt,
  FaPhone,
  FaMailBulk,
  FaUserTie,
  FaBuilding,
  FaGraduationCap,
  FaBriefcase,
  FaComments,
  FaUser,
  FaStar,
  FaGlobe,
  FaBullhorn
} from "react-icons/fa";
import {
  FiMail,
  FiSend,
  FiUserCheck,
  FiUserX,
  FiClock
} from "react-icons/fi";
import {
  getInterviews,
  getInterviewById,
  addInterview,
  updateInterview,
  deleteInterview,
  checkOfferLetter,
  getCsrfToken,
  getBackendURL,
} from "../../api/employeeApi";

// localStorage helpers
const getPersistedOfferLetterStatus = (interviewId) => {
  try {
    const sentLetters = JSON.parse(
      localStorage.getItem("sentOfferLetters") || "{}"
    );
    return sentLetters[interviewId]?.sent || false;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return false;
  }
};

const setPersistedOfferLetterStatus = (interviewId, email) => {
  try {
    const sentLetters = JSON.parse(
      localStorage.getItem("sentOfferLetters") || "{}"
    );
    sentLetters[interviewId] = {
      sent: true,
      email: email,
      timestamp: Date.now(),
    };
    localStorage.setItem("sentOfferLetters", JSON.stringify(sentLetters));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

const clearPersistedOfferLetterStatus = (interviewId) => {
  try {
    const sentLetters = JSON.parse(
      localStorage.getItem("sentOfferLetters") || "{}"
    );
    delete sentLetters[interviewId];
    localStorage.setItem("sentOfferLetters", JSON.stringify(sentLetters));
  } catch (error) {
    console.error("Error clearing from localStorage:", error);
  }
};

const Interviews = () => {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { id } = useParams();
  const [candidateData, setCandidateData] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const currentUser = localStorage.getItem("username");
  const [localInterviewDate, setLocalInterviewDate] = useState("");
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
  const [offerLetterSent, setOfferLetterSent] = useState(() => {
    if (location.state?.interviewId) {
      return getPersistedOfferLetterStatus(location.state.interviewId);
    }
    return false;
  });

  // Modern styles
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    sidebar: {
      width: "340px",
      backgroundColor: "white",
      borderRight: "1px solid #e2e8f0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      padding: "28px 24px",
      overflow: "hidden",
    },
    sidebarHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "28px",
    },
    sidebarTitle: {
      fontSize: "22px",
      fontWeight: "700",
      color: "#1e293b",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    searchContainer: {
      position: "relative",
      marginBottom: "20px",
    },
    searchIcon: {
      position: "absolute",
      left: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#64748b",
      fontSize: "15px",
    },
    searchInput: {
      width: "100%",
      padding: "14px 16px 14px 48px",
      border: "2px solid #e2e8f0",
      borderRadius: "12px",
      fontSize: "15px",
      backgroundColor: "#f8fafc",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      outline: "none",
    },
    searchInputFocus: {
      borderColor: "#3b82f6",
      backgroundColor: "white",
      boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
    },
    button: {
      padding: "14px 22px",
      borderRadius: "12px",
      border: "none",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: "14px",
    },
    buttonPrimary: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#f1f5f9",
      color: "#475569",
      border: "2px solid #e2e8f0",
    },
    buttonSuccess: {
      backgroundColor: "#10b981",
      color: "white",
    },
    buttonDanger: {
      backgroundColor: "#ef4444",
      color: "white",
    },
    buttonWarning: {
      backgroundColor: "#f59e0b",
      color: "white",
    },
    buttonInfo: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    buttonPurple: {
      backgroundColor: "#8b5cf6",
      color: "white",
    },
    buttonTeal: {
      backgroundColor: "#06b6d4",
      color: "white",
    },
    buttonGray: {
      backgroundColor: "#6b7280",
      color: "white",
    },
    buttonDisabled: {
      opacity: "0.5",
      cursor: "not-allowed",
      transform: "none !important",
    },
    interviewList: {
      flex: 1,
      overflowY: "auto",
      marginTop: "20px",
    },
    interviewItem: {
      padding: "18px",
      marginBottom: "10px",
      borderRadius: "12px",
      backgroundColor: "white",
      border: "2px solid #e2e8f0",
      cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    interviewItemActive: {
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      color: "white",
      transform: "translateX(4px)",
    },
    interviewItemHover: {
      borderColor: "#3b82f6",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      transform: "translateY(-2px)",
    },
    interviewName: {
      fontWeight: "600",
      fontSize: "15px",
      marginBottom: "6px",
    },
    interviewPosition: {
      fontSize: "13px",
      color: "#64748b",
      marginBottom: "10px",
    },
    interviewMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "12px",
    },
    content: {
      flex: 1,
      padding: "36px",
      overflowY: "auto",
      backgroundColor: "#f8fafc",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "18px",
      padding: "36px",
      marginBottom: "28px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.02)",
      border: "1px solid #e2e8f0",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "28px",
    },
    sectionTitle: {
      fontSize: "19px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "2px solid #f1f5f9",
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px",
      marginBottom: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    input: {
      padding: "14px 18px",
      border: "2px solid #e2e8f0",
      borderRadius: "12px",
      fontSize: "15px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      outline: "none",
      backgroundColor: "#f8fafc",
    },
    inputFocus: {
      borderColor: "#3b82f6",
      backgroundColor: "white",
      boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
    },
    textarea: {
      padding: "14px 18px",
      border: "2px solid #e2e8f0",
      borderRadius: "12px",
      fontSize: "15px",
      minHeight: "120px",
      resize: "vertical",
      backgroundColor: "#f8fafc",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      outline: "none",
    },
    scoreContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      marginBottom: "16px",
      border: "2px solid #e2e8f0",
    },
    scoreLabel: {
      fontWeight: "600",
      fontSize: "15px",
      color: "#334155",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    scoreInput: {
      width: "100px",
      padding: "12px",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      textAlign: "center",
      fontSize: "15px",
      backgroundColor: "white",
      fontWeight: "600",
      color: "#1e293b",
    },
    resultBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 18px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "700",
      gap: "8px",
    },
    resultPoor: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      border: "1px solid #fecaca",
    },
    resultAdequate: {
      backgroundColor: "#fef3c7",
      color: "#d97706",
      border: "1px solid #fde68a",
    },
    resultGood: {
      backgroundColor: "#dbeafe",
      color: "#2563eb",
      border: "1px solid #bfdbfe",
    },
    resultOutstanding: {
      backgroundColor: "#d1fae5",
      color: "#059669",
      border: "1px solid #a7f3d0",
    },
    tabContainer: {
      display: "flex",
      borderBottom: "2px solid #e2e8f0",
      marginBottom: "36px",
      gap: "6px",
    },
    tab: {
      padding: "14px 28px",
      fontSize: "15px",
      fontWeight: "600",
      color: "#64748b",
      cursor: "pointer",
      borderBottom: "3px solid transparent",
      transition: "all 0.2s",
      borderRadius: "8px 8px 0 0",
    },
    tabActive: {
      color: "#3b82f6",
      borderBottomColor: "#3b82f6",
      backgroundColor: "#eff6ff",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 20px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "700",
      gap: "8px",
      border: "2px solid",
    },
    statusImmediate: {
      backgroundColor: "#d1fae5",
      color: "#059669",
      borderColor: "#a7f3d0",
    },
    statusHold: {
      backgroundColor: "#fef3c7",
      color: "#d97706",
      borderColor: "#fde68a",
    },
    statusNoGood: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      borderColor: "#fecaca",
    },
    statusPending: {
      backgroundColor: "#e0e7ff",
      color: "#4f46e5",
      borderColor: "#c7d2fe",
    },
    actionButtons: {
      display: "flex",
      gap: "16px",
      marginTop: "36px",
      paddingTop: "28px",
      borderTop: "2px solid #f1f5f9",
      flexWrap: "wrap",
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "16px",
      marginBottom: "28px",
    },
    statCard: {
      backgroundColor: "white",
      padding: "22px",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      border: "2px solid #e2e8f0",
      textAlign: "center",
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#1e293b",
      marginBottom: "6px",
    },
    statLabel: {
      fontSize: "13px",
      color: "#64748b",
      fontWeight: "600",
    },
    toast: {
      position: "fixed",
      top: "28px",
      right: "28px",
      padding: "18px 28px",
      borderRadius: "14px",
      color: "white",
      boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: "14px",
      animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    toastSuccess: {
      backgroundColor: "#10b981",
    },
    toastError: {
      backgroundColor: "#ef4444",
    },
    toastInfo: {
      backgroundColor: "#3b82f6",
    },
    loading: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "56px",
      color: "#64748b",
      flexDirection: "column",
      gap: "16px",
    },
    evaluationGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "20px",
      marginTop: "24px",
    },
    evaluationCard: {
      backgroundColor: "#f8fafc",
      padding: "20px",
      borderRadius: "14px",
      border: "2px solid #e2e8f0",
      transition: "all 0.2s",
    },
    evaluationCardHover: {
      borderColor: "#3b82f6",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)",
    },
    evaluationScore: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#3b82f6",
      marginTop: "12px",
    },
    checkboxGroup: {
      display: "flex",
      gap: "24px",
      marginTop: "20px",
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "12px 18px",
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      border: "2px solid #e2e8f0",
      transition: "all 0.2s",
    },
    checkboxContainerSelected: {
      backgroundColor: "#eff6ff",
      borderColor: "#3b82f6",
    },
    checkbox: {
      width: "20px",
      height: "20px",
      borderRadius: "6px",
      border: "2px solid #cbd5e1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    checkboxChecked: {
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
    },
    emptyState: {
      textAlign: "center",
      padding: "56px 28px",
      color: "#64748b",
    },
    emptyIcon: {
      fontSize: "56px",
      marginBottom: "20px",
      opacity: "0.4",
    },
    progressBar: {
      height: "8px",
      backgroundColor: "#e2e8f0",
      borderRadius: "4px",
      marginTop: "8px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3b82f6",
      borderRadius: "4px",
      transition: "width 0.3s",
    },
    iconWrapper: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "16px",
    },
  };

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // --- Original Functions (Keep all your existing functionality) ---

  useEffect(() => {
    if (formData.interview_date) {
      const date = new Date(formData.interview_date);
      const bangladeshTime = new Date(date.getTime() + 6 * 60 * 60 * 1000);

      const year = bangladeshTime.getFullYear();
      const month = String(bangladeshTime.getMonth() + 1).padStart(2, "0");
      const day = String(bangladeshTime.getDate()).padStart(2, "0");
      const hours = String(bangladeshTime.getHours()).padStart(2, "0");
      const minutes = String(bangladeshTime.getMinutes()).padStart(2, "0");

      setLocalInterviewDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setLocalInterviewDate("");
    }
  }, [formData.interview_date]);

  const handleInterviewDateChange = (e) => {
    const bangladeshDateTime = e.target.value;
    setLocalInterviewDate(bangladeshDateTime);

    if (bangladeshDateTime) {
      const bangladeshDate = new Date(bangladeshDateTime);
      const utcDate = new Date(bangladeshDate.getTime() - 6 * 60 * 60 * 1000);

      setFormData((prev) => ({
        ...prev,
        interview_date: utcDate.toISOString(),
      }));
    }
  };

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

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const interviewId = queryParams.get("interview_id");

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

      if (urlData.email) {
        checkOfferLetterSent(urlData.email);
      }

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

      if (location.state.email) {
        checkOfferLetterSent(location.state.email);
      }
    } else if (id) {
      fetchCandidateData(id);
    }

    if (interviewId) {
      fetchInterviewById(interviewId);
      navigate(location.pathname, { replace: true });
    }
  }, [location, id, navigate]);

  useEffect(() => {
    if (formData?.email) {
      checkOfferLetterSent(formData.email);
    }
  }, [formData.email]);

  const fetchInterviewById = async (interviewId) => {
    try {
      const interview = await getInterviewById(interviewId);
      setSelectedInterview(interview.data);
      setFormData({
        ...interview.data,
        interview_date: interview.data.interview_date
          ? new Date(interview.data.interview_date).toISOString().slice(0, 16)
          : "",
      });

      const apiStatus = interview.data.offer_letter_sent === true;
      const localStorageStatus = getPersistedOfferLetterStatus(interviewId);

      if (apiStatus || localStorageStatus) {
        setOfferLetterSent(true);
        if (apiStatus && !localStorageStatus) {
          setPersistedOfferLetterStatus(interviewId, interview.data.email);
        }
      }

      if (interview.data.email) {
        checkOfferLetterSent(interview.data.email);
      }
    } catch (err) {
      console.error("Failed to load interview from URL:", err);
      showToast("Failed to load interview", "error");
    }
  };

  const fetchCandidateData = async (candidateId) => {
    try {
      const response = await fetch(
        `http://119.148.51.38:8000/api/hrms/api/CVAdd/${candidateId}/`
      );
      const data = await response.json();
      setCandidateData(data);
      setFormData((prev) => ({
        ...prev,
        name: data.name || "",
        position_for: data.position_for || "",
        age: data.age || "",
        email: data.email || "",
        phone: data.phone || "",
        reference: data.reference || "",
      }));
    } catch (error) {
      console.error("Error fetching candidate data:", error);
      showToast("Failed to fetch candidate data", "error");
    }
  };

  useEffect(() => {
    if (formData.interview_mark || formData.interview_result) {
      setShowPopup(true);
      const timer = setTimeout(() => setShowPopup(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [formData.interview_mark, formData.interview_result]);

  useEffect(() => {
    if (location.state?.interview) {
      setSelectedInterview(location.state.interview);
      setFormData(location.state.interview);
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: inputValue,
      };

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

  useEffect(() => {
    if (location.state?.letterSent && location.state?.offerLetterSent) {
      setOfferLetterSent(true);

      if (selectedInterview) {
        setSelectedInterview((prev) => ({
          ...prev,
          offer_letter_sent: true,
        }));

        setFormData((prev) => ({
          ...prev,
          offer_letter_sent: true,
        }));
      }

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, selectedInterview, navigate]);

  const checkOfferLetterSent = async (email) => {
    if (!email) return false;

    try {
      const res = await checkOfferLetter(email);
      const isSent = res?.offer_letter_sent === true;

      if (isSent && selectedInterview?.id) {
        setOfferLetterSent(true);
        setPersistedOfferLetterStatus(selectedInterview.id, email);

        setFormData((prev) => ({ ...prev, offer_letter_sent: true }));
        if (selectedInterview) {
          setSelectedInterview((prev) => ({
            ...prev,
            offer_letter_sent: true,
          }));
        }
      }

      return isSent;
    } catch (error) {
      console.error("Error checking offer letter:", error);
      return false;
    }
  };

  useEffect(() => {
    if (
      location.state?.offerLetterSent === true &&
      location.state?.interviewId
    ) {
      const interviewId = location.state.interviewId;

      setOfferLetterSent(true);
      setPersistedOfferLetterStatus(interviewId, location.state.sentEmail);

      if (selectedInterview && interviewId === selectedInterview.id) {
        setSelectedInterview((prev) => ({
          ...prev,
          offer_letter_sent: true,
        }));

        setFormData((prev) => ({
          ...prev,
          offer_letter_sent: true,
        }));
      }

      fetchInterviews();

      setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 100);
    }
  }, [location.state]);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const response = await getInterviews();
      setInterviews(response.data);
    } catch (error) {
      showToast("Error fetching interviews", "error");
      console.error("Error fetching interviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFormData(formData)) {
      return;
    }

    setIsLoading(true);

    let csrfToken = getCsrfToken();

    if (!csrfToken) {
      showToast("Setting up security token...", "info");

      try {
        const response = await fetch(`${getBackendURL()}/api/csrf/`, {
          credentials: "include",
        });
        csrfToken = getCsrfToken();
      } catch (error) {
        console.error("❌ Failed to fetch CSRF token:", error);
      }
    }

    if (!csrfToken) {
      showToast("Security token missing. Please refresh the page.", "error");
      setIsLoading(false);
      return;
    }

    const jsonData = { ...formData };

    const numericFields = [
      "education",
      "job_knowledge",
      "work_experience",
      "communication",
      "personality",
      "potential",
      "general_knowledge",
      "assertiveness",
      "interview_mark",
      "current_remuneration",
      "expected_package",
      "notice_period_required",
    ];

    numericFields.forEach((field) => {
      const value = jsonData[field];
      if (value === "" || value == null) {
        jsonData[field] = null;
      } else {
        jsonData[field] = parseInt(value, 10) || 0;
      }
    });

    if (!jsonData.age || jsonData.age === "") {
      jsonData.age = null;
    }

    if (!jsonData.interview_mark) {
      const { interviewMark } = calculateInterviewMark(jsonData);
      jsonData.interview_mark = interviewMark;
    }

    try {
      let res;
      if (selectedInterview) {
        res = await updateInterview(selectedInterview.id, jsonData);
        showToast("Interview updated successfully!", "success");
      } else {
        res = await addInterview(jsonData);
        showToast("Interview created successfully!", "success");
      }

      fetchInterviews();
      if (!selectedInterview && res.data?.id) {
        navigate(`/interviews?interview_id=${res.data.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Submit error:", error.response?.data);
      showToast(
        "Failed to save: " + (error.response?.data?.detail || error.message),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateFormData = (formData) => {
    if (!formData.name?.trim()) {
      showToast("Candidate name is required", "error");
      return false;
    }

    if (!formData.position_for?.trim()) {
      showToast("Position is required", "error");
      return false;
    }

    if (!formData.email?.trim()) {
      showToast("Email is required", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("Please enter a valid email address", "error");
      return false;
    }

    if (!formData.phone?.trim()) {
      showToast("Phone number is required", "error");
      return false;
    }

    if (!formData.interview_date) {
      showToast("Interview date is required", "error");
      return false;
    }

    if (!selectedInterview) {
      const interviewDate = new Date(formData.interview_date);
      const now = new Date();

      interviewDate.setSeconds(0, 0);
      now.setSeconds(0, 0);

      if (interviewDate < now) {
        showToast(
          "Interview date cannot be in the past for new interviews",
          "error"
        );
        return false;
      }
    }

    const scoreFields = [
      { name: "education", max: 20 },
      { name: "job_knowledge", max: 20 },
      { name: "work_experience", max: 10 },
      { name: "communication", max: 10 },
      { name: "personality", max: 10 },
      { name: "potential", max: 10 },
      { name: "general_knowledge", max: 10 },
      { name: "assertiveness", max: 10 },
    ];

    for (const field of scoreFields) {
      const value = parseInt(formData[field.name]) || 0;
      if (value < 0 || value > field.max) {
        showToast(
          `${field.name.replace("_", " ")} must be between 0 and ${field.max}`,
          "error"
        );
        return false;
      }
    }

    const statusFields = ["immediate_recruitment", "on_hold", "no_good"];
    const selectedStatuses = statusFields.filter((field) => formData[field]);

    if (selectedStatuses.length > 1) {
      showToast(
        "Only one status can be selected (Immediate Recruitment, On Hold, or No Good)",
        "error"
      );
      return false;
    }

    return true;
  };

  const handleInterviewAction = async (e) => {
    e.preventDefault();
    const action = selectedInterview ? "update" : "create";

    if (window.confirm(`Are you sure you want to ${action} this interview?`)) {
      await handleSubmit(e);
    }
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) return;

    try {
      await deleteInterview(id);
      showToast("Interview deleted successfully!", "success");
      fetchInterviews();
      resetForm();
      setSelectedInterview(null);
    } catch (error) {
      console.error("Delete error:", error.response?.data);
      showToast("Failed to delete interview", "error");
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const printInterview = (interview) => {
    // Keep your existing print function
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
  
            <!-- Signature Section -->
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

  const handleSendMail = (interview) =>
    navigate("/mailmdsir", { state: interview });
  const handleInviteMail = (interview) =>
    navigate("/invitemail", { state: interview });
  const handleLetterSend = (interview) =>
    navigate("/add-letter", {
      state: {
        ...interview,
        id: interview.id,
      },
    });
  const handleSelectedAsEmployee = (interview) =>
    navigate("/add-employee", {
      state: {
        ...interview,
        date_of_birth: interview.age || "",
      },
    });

  const getArrowStage = () => {
    const currentInterviewId = selectedInterview?.id;

    const isOfferLetterSentFromAPI =
      selectedInterview?.offer_letter_sent === true;
    const isOfferLetterSentFromState = offerLetterSent;
    const isOfferLetterSentFromLocalStorage = currentInterviewId
      ? getPersistedOfferLetterStatus(currentInterviewId)
      : false;
    const isOfferLetterSentFromLocation =
      location.state?.offerLetterSent === true;

    const isOfferLetterSent =
      isOfferLetterSentFromAPI ||
      isOfferLetterSentFromState ||
      isOfferLetterSentFromLocalStorage ||
      isOfferLetterSentFromLocation;

    if (formData.no_good) {
      return "delete_interview";
    }

    if (isOfferLetterSent) {
      return "create_employee";
    }

    if (formData.final_selection_remarks) {
      return "send_offer";
    }

    const hasEvaluation = formData.education || formData.job_knowledge;
    if (hasEvaluation) {
      return "send_md";
    }

    const hasCandidateInfo =
      formData.name &&
      formData.position_for &&
      formData.email &&
      formData.phone;
    if (hasCandidateInfo) {
      return "invite";
    }

    return "";
  };

  const isButtonDisabled = (buttonStage) => {
    const currentStage = getArrowStage();
    return currentStage !== buttonStage;
  };

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

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;

    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          immediate_recruitment: name === "immediate_recruitment",
          on_hold: name === "on_hold",
          no_good: name === "no_good",
          [name]: checked,
        };
      }
      return {
        ...prev,
        [name]: checked,
      };
    });
  };

  const getStatusBadge = (interview) => {
    if (interview.immediate_recruitment) {
      return { ...styles.statusBadge, ...styles.statusImmediate };
    } else if (interview.on_hold) {
      return { ...styles.statusBadge, ...styles.statusHold };
    } else if (interview.no_good) {
      return { ...styles.statusBadge, ...styles.statusNoGood };
    } else {
      return { ...styles.statusBadge, ...styles.statusPending };
    }
  };

  const getStatusText = (interview) => {
    if (interview.immediate_recruitment) return "Immediate";
    if (interview.on_hold) return "On Hold";
    if (interview.no_good) return "No Good";
    return "Pending";
  };

  const getStatusIcon = (interview) => {
    if (interview.immediate_recruitment) return <FaCheckCircle />;
    if (interview.on_hold) return <FaCalendarAlt />;
    if (interview.no_good) return <FiUserX />;
    return <FaUserTie />;
  };

  const getEvaluationIcon = (field) => {
    const icons = {
      education: <FaGraduationCap />,
      job_knowledge: <FaBriefcase />,
      work_experience: <FaBuilding />,
      communication: <FaComments />,
      personality: <FaUser />,
      potential: <FaStar />,
      general_knowledge: <FaGlobe />,
      assertiveness: <FaBullhorn />,
    };
    return icons[field] || <FaStar />;
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      
      {/* Modern Sidebar */}
      <div style={styles.sidebar}>
        
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>
            <FaUserTie size={24} /> Interviews
          </div>
        </div>
        

        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.backgroundColor = "white";
              e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.backgroundColor = "#f8fafc";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={resetForm}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <FaUserPlus /> New Interview
        </button>

        <button
          style={{ ...styles.button, ...styles.buttonSecondary }}
          onClick={printAllInterviews}
          disabled={interviews.length === 0}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <FaPrint /> Print All
        </button>

        {/* Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{interviews.length}</div>
            <div style={styles.statLabel}>Total Interviews</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>
              {interviews.filter(i => i.interview_result === "Outstanding").length}
            </div>
            <div style={styles.statLabel}>Outstanding</div>
          </div>
        </div>

        {/* Interview List */}
        <div style={{ maxHeight: "calc(50vh - 50px)", overflowY: "auto" }}>
        <div style={styles.interviewList}>
          {isLoading ? (
            <div style={styles.loading}>
              <div className="animate-pulse">Loading interviews...</div>
            </div>
          ) : interviews.length === 0 ? (
            <div style={styles.emptyState}>
              <FaUserTie style={styles.emptyIcon} />
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                No interviews scheduled
              </div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                Click "New Interview" to create your first interview
              </div>
            </div>
          ) : (
            interviews
              .filter((interview) => {
                const searchLower = searchQuery.toLowerCase();
                return (
                  interview.name.toLowerCase().includes(searchLower) ||
                  (interview.position_for &&
                    interview.position_for
                      .toLowerCase()
                      .includes(searchLower)) ||
                  (interview.email &&
                    interview.email.toLowerCase().includes(searchLower)) ||
                  (interview.phone && interview.phone.includes(searchQuery))
                );
              })
              .map((interview) => (
                <div
                  key={interview.id}
                  style={{
                    ...styles.interviewItem,
                    ...(selectedInterview?.id === interview.id && styles.interviewItemActive),
                  }}
                  onMouseEnter={(e) => {
                    if (selectedInterview?.id !== interview.id) {
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedInterview?.id !== interview.id) {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
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
                  className="animate-fadeIn"
                >
                  <div style={styles.interviewName}>{interview.name}</div>
                  <div style={styles.interviewPosition}>
                    {interview.position_for}
                  </div>
                  <div style={styles.interviewMeta}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaCalendarAlt style={{ fontSize: "11px" }} />
                      {new Date(interview.interview_date).toLocaleDateString()}
                    </div>
                    <div style={getResultBadgeStyle(interview.interview_result)}>
                      {interview.interview_result}
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {getStatusIcon(interview)}
                    <span style={{ fontSize: "12px", fontWeight: "600" }}>{getStatusText(interview)}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      </div>

      {/* Modern Main Content */}
      <div style={styles.content}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              ...styles.toast,
              ...(toast.type === "error"
                ? styles.toastError
                : toast.type === "info"
                ? styles.toastInfo
                : styles.toastSuccess),
            }}
            className="animate-fadeIn"
          >
            {toast.type === "success" && <FaCheckCircle size={20} />}
            {toast.type === "error" && <FaTimes size={20} />}
            {toast.type === "info" && <FaCheckCircle size={20} />}
            <div>
              <div style={{ fontWeight: "700", fontSize: "15px" }}>{toast.message}</div>
            </div>
          </div>
        )}

        {selectedInterview ? (
          <div className="animate-fadeIn">
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

            {/* Details View */}
            {activeTab === "details" ? (
              <div>
                {/* Header Card */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h2 style={{ margin: 0, color: "#1e293b", fontSize: "28px", fontWeight: "800" }}>
                        {selectedInterview.name}
                      </h2>
                      <div style={{ color: "#64748b", marginTop: "8px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", backgroundColor: "#f1f5f9", borderRadius: "8px" }}>
                          <FaUserTie size={14} /> {selectedInterview.position_for}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", backgroundColor: "#f1f5f9", borderRadius: "8px" }}>
                          <FaMailBulk size={14} /> {selectedInterview.email}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", backgroundColor: "#f1f5f9", borderRadius: "8px" }}>
                          <FaPhone size={14} /> {selectedInterview.phone}
                        </span>
                      </div>
                    </div>
                    <div style={getStatusBadge(selectedInterview)}>
                      {getStatusIcon(selectedInterview)}
                      {getStatusText(selectedInterview)}
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaCalendarAlt /> Date of Birth
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.age || "Not specified"}
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaCalendarAlt /> Interview Date
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {new Date(selectedInterview.interview_date).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaBuilding /> Place
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.place || "Not specified"}
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaUserTie /> Reference
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.reference || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Card */}
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>Evaluation Summary</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "40px", marginBottom: "28px", flexWrap: "wrap" }}>
                    <div>
                      <div style={styles.label}>Overall Score</div>
                      <div style={{ fontSize: "56px", fontWeight: "800", color: "#3b82f6", lineHeight: "1" }}>
                        {selectedInterview.interview_mark}/100
                      </div>
                      <div style={styles.progressBar}>
                        <div 
                          style={{ 
                            ...styles.progressFill, 
                            width: `${selectedInterview.interview_mark}%` 
                          }} 
                        />
                      </div>
                    </div>
                    <div>
                      <div style={styles.label}>Result</div>
                      <div style={getResultBadgeStyle(selectedInterview.interview_result)}>
                        {selectedInterview.interview_result}
                      </div>
                    </div>
                  </div>

                  <div style={styles.evaluationGrid}>
                    {[
                      { label: "Education", value: selectedInterview.education, max: 20, field: "education" },
                      { label: "Job Knowledge", value: selectedInterview.job_knowledge, max: 20, field: "job_knowledge" },
                      { label: "Work Experience", value: selectedInterview.work_experience, max: 10, field: "work_experience" },
                      { label: "Communication", value: selectedInterview.communication, max: 10, field: "communication" },
                      { label: "Personality", value: selectedInterview.personality, max: 10, field: "personality" },
                      { label: "Potential", value: selectedInterview.potential, max: 10, field: "potential" },
                      { label: "General Knowledge", value: selectedInterview.general_knowledge, max: 10, field: "general_knowledge" },
                      { label: "Assertiveness", value: selectedInterview.assertiveness, max: 10, field: "assertiveness" },
                    ].map((item, index) => (
                      <div 
                        key={index} 
                        style={styles.evaluationCard}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <div style={{ 
                            ...styles.iconWrapper, 
                            backgroundColor: "#eff6ff",
                            color: "#3b82f6"
                          }}>
                            {getEvaluationIcon(item.field)}
                          </div>
                          <div style={styles.scoreLabel}>{item.label}</div>
                        </div>
                        <div style={styles.evaluationScore}>
                          {item.value || 0}/{item.max}
                        </div>
                        <div style={styles.progressBar}>
                          <div 
                            style={{ 
                              ...styles.progressFill, 
                              width: `${((item.value || 0) / item.max) * 100}%` 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision & Notes Card */}
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>Decision & Notes</div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FiClock /> Current Remuneration
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.current_remuneration || "Not specified"}
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaFileAlt /> Expected Package
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.expected_package || "Not specified"}
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaCalendarAlt /> Notice Period Required
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.notice_period_required || "Not specified"}
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaCheckCircle /> Recommendation
                      </label>
                      <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "2px solid #e2e8f0", fontWeight: "500" }}>
                        {selectedInterview.recommendation || "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "28px" }}>
                    <label style={styles.label}>
                      <FaComments /> Interview Notes
                    </label>
                    <div style={{ 
                      padding: "18px", 
                      backgroundColor: "#f8fafc", 
                      borderRadius: "12px", 
                      minHeight: "100px",
                      border: "2px solid #e2e8f0",
                      lineHeight: "1.6"
                    }}>
                      {selectedInterview.interview_notes || "No notes available"}
                    </div>
                  </div>

                  <div style={{ marginTop: "28px" }}>
                    <label style={styles.label}>
                      <FaUserTie /> Final Selection Remarks (MD Sir)
                    </label>
                    <div style={{ 
                      padding: "18px", 
                      backgroundColor: "#f0f9ff", 
                      borderRadius: "12px", 
                      minHeight: "100px",
                      border: "2px solid #bae6fd",
                      lineHeight: "1.6"
                    }}>
                      {selectedInterview.final_selection_remarks || "No remarks provided"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={styles.actionButtons}>
                  <button
                    style={{ ...styles.button, ...styles.buttonInfo }}
                    onClick={() => printInterview(selectedInterview)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <FaPrint /> Print
                  </button>

                  {/* Invite for Interview */}
                  <div style={{ position: "relative" }}>
                    {getArrowStage() === "invite" && (
                      <FaArrowDown
                        style={{
                          position: "absolute",
                          top: "-24px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#8b5cf6",
                          fontSize: "18px",
                        }}
                      />
                    )}
                    <button
                      disabled={isButtonDisabled("invite")}
                      style={{
                        ...styles.button,
                        ...styles.buttonPurple,
                        ...(isButtonDisabled("invite") && styles.buttonDisabled),
                      }}
                      onClick={() => handleInviteMail(selectedInterview)}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FiMail /> Invite
                    </button>
                  </div>

                  {/* Send to MD Sir */}
                  <div style={{ position: "relative" }}>
                    {getArrowStage() === "send_md" && (
                      <FaArrowDown
                        style={{
                          position: "absolute",
                          top: "-24px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#f59e0b",
                          fontSize: "18px",
                        }}
                      />
                    )}
                    <button
                      disabled={isButtonDisabled("send_md")}
                      style={{
                        ...styles.button,
                        ...styles.buttonWarning,
                        ...(isButtonDisabled("send_md") && styles.buttonDisabled),
                      }}
                      onClick={() => handleSendMail(selectedInterview)}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FiSend /> Send to MD
                    </button>
                  </div>

                  {/* Send Offer Letter */}
                  <div style={{ position: "relative" }}>
                    {getArrowStage() === "send_offer" && (
                      <FaArrowDown
                        style={{
                          position: "absolute",
                          top: "-24px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#06b6d4",
                          fontSize: "18px",
                        }}
                      />
                    )}
                    <button
                      disabled={isButtonDisabled("send_offer")}
                      style={{
                        ...styles.button,
                        ...styles.buttonTeal,
                        ...(isButtonDisabled("send_offer") && styles.buttonDisabled),
                      }}
                      onClick={() => handleLetterSend(selectedInterview)}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FaFileAlt /> Offer Letter
                    </button>
                  </div>

                  {/* Create Employee */}
                  <div style={{ position: "relative" }}>
                    {getArrowStage() === "create_employee" && (
                      <FaArrowDown
                        style={{
                          position: "absolute",
                          top: "-24px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#10b981",
                          fontSize: "18px",
                        }}
                      />
                    )}
                    <button
                      disabled={isButtonDisabled("create_employee")}
                      style={{
                        ...styles.button,
                        ...styles.buttonSuccess,
                        ...(isButtonDisabled("create_employee") && styles.buttonDisabled),
                      }}
                      onClick={() => handleSelectedAsEmployee(selectedInterview)}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FiUserCheck /> Create Employee
                    </button>
                  </div>

                  {/* Delete */}
                  <div style={{ position: "relative" }}>
                    {getArrowStage() === "delete_interview" && (
                      <FaArrowDown
                        style={{
                          position: "absolute",
                          top: "-24px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#ef4444",
                          fontSize: "18px",
                        }}
                      />
                    )}
                    <button
                      style={{ ...styles.button, ...styles.buttonDanger }}
                      onClick={() => handleDelete(selectedInterview.id)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Edit View
              <div>
                <form onSubmit={handleInterviewAction}>
                  <div style={styles.card}>
                    <div style={styles.sectionTitle}>
                      Candidate Information
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaUserTie /> Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaBriefcase /> Position
                        </label>
                        <input
                          type="text"
                          name="position_for"
                          value={formData.position_for}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaCalendarAlt /> Date of Birth
                        </label>
                        <input
                          type="date"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaUserTie /> Reference
                        </label>
                        <input
                          type="text"
                          name="reference"
                          value={formData.reference}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaMailBulk /> Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaPhone /> Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaCalendarAlt /> Interview Date
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <input
                            type="datetime-local"
                            value={localInterviewDate}
                            onChange={handleInterviewDateChange}
                            style={styles.input}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#3b82f6";
                              e.target.style.backgroundColor = "white";
                              e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              e.target.style.backgroundColor = "#f8fafc";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                            (Bangladesh Time)
                          </span>
                        </div>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaBuilding /> Place
                        </label>
                        <input
                          type="text"
                          name="place"
                          value={formData.place}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.sectionTitle}>Evaluation Criteria</div>

                    <div style={styles.evaluationGrid}>
                      {[
                        { label: "Education (Max 20)", name: "education", max: 20, icon: <FaGraduationCap /> },
                        { label: "Job Knowledge (Max 20)", name: "job_knowledge", max: 20, icon: <FaBriefcase /> },
                        { label: "Work Experience (Max 10)", name: "work_experience", max: 10, icon: <FaBuilding /> },
                        { label: "Communication (Max 10)", name: "communication", max: 10, icon: <FaComments /> },
                        { label: "Personality (Max 10)", name: "personality", max: 10, icon: <FaUser /> },
                        { label: "Potential (Max 10)", name: "potential", max: 10, icon: <FaStar /> },
                        { label: "General Knowledge (Max 10)", name: "general_knowledge", max: 10, icon: <FaGlobe /> },
                        { label: "Assertiveness (Max 10)", name: "assertiveness", max: 10, icon: <FaBullhorn /> },
                      ].map((item, index) => (
                        <div key={index} style={styles.scoreContainer}>
                          <div style={styles.scoreLabel}>
                            {item.icon} {item.label}
                          </div>
                          <input
                            type="number"
                            name={item.name}
                            value={formData[item.name]}
                            onChange={handleInputChange}
                            style={styles.scoreInput}
                            min="0"
                            max={item.max}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#3b82f6";
                              e.target.style.backgroundColor = "white";
                              e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "24px" }}>
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
                          <FiClock /> Current Remuneration
                        </label>
                        <input
                          type="text"
                          name="current_remuneration"
                          value={formData.current_remuneration}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaFileAlt /> Expected Package
                        </label>
                        <input
                          type="text"
                          name="expected_package"
                          value={formData.expected_package}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaCalendarAlt /> Notice Period Required
                        </label>
                        <input
                          type="text"
                          name="notice_period_required"
                          value={formData.notice_period_required}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaCheckCircle /> Recommendation
                        </label>
                        <input
                          type="text"
                          name="recommendation"
                          value={formData.recommendation}
                          onChange={handleInputChange}
                          style={styles.input}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <label style={styles.label}>Status</label>
                      <div style={styles.checkboxGroup}>
                        {[
                          { label: "Immediate Recruitment", name: "immediate_recruitment" },
                          { label: "On Hold", name: "on_hold" },
                          { label: "No Good", name: "no_good" },
                        ].map((item) => (
                          <label 
                            key={item.name}
                            style={{
                              ...styles.checkboxContainer,
                              ...(formData[item.name] && styles.checkboxContainerSelected),
                            }}
                            onClick={() => {
                              const event = {
                                target: {
                                  name: item.name,
                                  checked: !formData[item.name],
                                },
                              };
                              handleCheckboxChange(event);
                            }}
                          >
                            <div 
                              style={{
                                ...styles.checkbox,
                                ...(formData[item.name] && styles.checkboxChecked),
                              }}
                            >
                              {formData[item.name] && <FaCheckCircle style={{ color: "white", fontSize: "12px" }} />}
                            </div>
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <label style={styles.label}>
                        <FaComments /> Interview Notes
                      </label>
                      <textarea
                        name="interview_notes"
                        value={formData.interview_notes}
                        onChange={handleInputChange}
                        style={styles.textarea}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <label style={styles.label}>
                        <FaUserTie /> Final Selection Remarks (MD Sir)
                        {currentUser !== "Tuhin" && (
                          <span
                            style={{
                              color: "#ef4444",
                              fontSize: "13px",
                              marginLeft: "12px",
                              fontWeight: "500",
                            }}
                          >
                            (Only editable by Tuhin)
                          </span>
                        )}
                      </label>
                      <textarea
                        name="final_selection_remarks"
                        value={formData.final_selection_remarks || ""}
                        onChange={handleInputChange}
                        style={{
                          ...styles.textarea,
                          backgroundColor:
                            currentUser !== "Tuhin" ? "#f1f5f9" : "white",
                          cursor:
                            currentUser !== "Tuhin" ? "not-allowed" : "text",
                        }}
                        readOnly={currentUser !== "Tuhin"}
                        placeholder={
                          currentUser !== "Tuhin"
                            ? "Contact Tuhin to edit this field"
                            : "Enter final selection remarks"
                        }
                        onFocus={(e) => {
                          if (currentUser === "Tuhin") {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                            e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                          }
                        }}
                        onBlur={(e) => {
                          if (currentUser === "Tuhin") {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.boxShadow = "none";
                          }
                        }}
                      />
                    </div>
                  </div>
                </form>
                <div style={styles.actionButtons}>
                  <button
                    type="submit"
                    style={{
                      ...styles.button,
                      ...styles.buttonPrimary,
                      ...(isLoading && { opacity: 0.7 }),
                    }}
                    disabled={isLoading}
                    onClick={handleInterviewAction}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-pulse">Processing...</div>
                      </>
                    ) : selectedInterview ? (
                      <>
                        <FaSave /> Update Interview
                      </>
                    ) : (
                      <>
                        <FaSave /> Create Interview
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.buttonGray }}
                    onClick={resetForm}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Create New Interview View
          <div className="animate-fadeIn">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={{ margin: 0, color: "#1e293b", fontSize: "28px", fontWeight: "800" }}>
                  Schedule New Interview
                </h2>
              </div>
              
              <form onSubmit={handleInterviewAction}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>Candidate Information</div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaUserTie /> Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaBriefcase /> Position
                      </label>
                      <input
                        type="text"
                        name="position_for"
                        value={formData.position_for}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaCalendarAlt /> Date of Birth
                      </label>
                      <input
                        type="date"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaUserTie /> Reference
                      </label>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaMailBulk /> Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaPhone /> Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaCalendarAlt /> Interview Date
                      </label>
                      <input
                        type="datetime-local"
                        name="interview_date"
                        value={formData.interview_date}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaBuilding /> Place
                      </label>
                      <input
                        type="text"
                        name="place"
                        value={formData.place}
                        onChange={handleInputChange}
                        style={styles.input}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                          e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.boxShadow = "none";
                        }}
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
                    ...styles.buttonPrimary,
                    ...(isLoading && { opacity: 0.7 }),
                  }}
                  disabled={isLoading}
                  onClick={handleInterviewAction}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  {isLoading ? (
                    <div className="animate-pulse">Processing...</div>
                  ) : (
                    <>
                      <FaSave /> Schedule Interview
                    </>
                  )}
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.buttonGray }}
                  onClick={resetForm}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
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
            padding: "18px 28px",
            backgroundColor: "#10b981",
            color: "white",
            borderRadius: "14px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <FaCheckCircle size={22} />
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px" }}>
              Interview Evaluated
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "4px" }}>
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