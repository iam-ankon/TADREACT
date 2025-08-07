// import React from "react";
// import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
// import Sidebar from "./components/hr/Sidebar";
// import EmployeeDetails from "./components/hr/EmployeeDetails";
// import Notifications from "./components/hr/Notifications";
// import Attendance from "./components/hr/Attendance";
// import EmailLog from "./components/hr/EmailLog";
// import "./styles/App.css";
// import EmployeeDetailPage from "./components/hr/EmployeeDetailPage";
// import EditEmployeePage from "./components/hr/EditEmployeePage";
// import LoginPage from "./components/hr/LoginPage";
// import AddEmployee from "./components/hr/AddEmployee";
// import Interviews from "./components/hr/Interviews";
// import HRWorkPage from './components/hr/HRWorkPage';
// import DashboardPage from './components/hr/DashboardPage';
// import LetterSend from "./components/hr/LetterSend";
// import CVAdd from "./components/hr/CVAdd";
// import ITProvision from "./components/hr/ITProvision";
// import AdminProvision from "./components/hr/AdminProvision";
// import FinanceProvision from "./components/hr/FinanceProvision";
// import AddLetterPage from "./components/hr/AddLetterPage";
// import CVList from "./components/hr/CVList";
// import CVEdit from "./components/hr/CVEdit";
// import EditCVPage from "./components/hr/EditCVPage";
// import EmployeeAttachments from "./components/hr/EmployeeAttachments";
// import TADGroups from "./components/hr/TADGroups";
// import EmployeeTermination from "./components/hr/EmployeeTermination";
// import TerminationAttachment from "./components/hr/TerminationAttachment"
// import CVDetail from "./components/hr/CVDetail";
// import MailMdSir from "./components/hr/MailMdSir";
// import InviteMail from "./components/hr/InviteMail"
// import PerformanseAppraisal from "./components/hr/PerformanseAppraisal";
// import NewAppraisal from "./components/hr/NewAppraisal";
// import AppraisalDetails from "./components/hr/AppraisalDetails";
// import EditAppraisal from "./components/hr/EditAppraisal";
// import EmployeeLeaveBalance from "./components/hr/EmployeeLeaveBalance";
// import EmployeeLeaveType from "./components/hr/EmployeeLeaveType";
// import EmployeeLeave from "./components/hr/EmployeeLeave";
// import AddLeaveRequest from "./components/hr/AddLeaveRequest";
// import LeaveRequestDetails from "./components/hr/LeaveRequestDetails";
// import EditLeaveRequest from "./components/hr/EditLeaveRequest";
// import CustomerPage from "./components/merchandiser/CustomerPage";
// import BuyerPage from "./components/merchandiser/BuyerPage";
// import AgentPage from "./components/merchandiser/AgentPage";
// import AddAgents from "./components/merchandiser/AddAgents";
// import EditAgents from "./components/merchandiser/EditAgents";
// import AddBuyer from "./components/merchandiser/AddBuyer";
// import EditBuyer from "./components/merchandiser/EditBuyer";
// import AddCustomer from "./components/merchandiser/AddCustomer";
// import EditCustomer from "./components/merchandiser/EditCustomer";
// import Supplier from './components/merchandiser/Supplier';
// import AddSupplier from './components/merchandiser/AddSupplier';
// import EditSupplier from './components/merchandiser/EditSupplier';
// import DetailSupplier from './components/merchandiser/DetailSupplier.jsx';
// import Inquiry from './components/merchandiser/Inquiry.jsx';
// import EditInquiry from './components/merchandiser/EditInquiry.jsx';
// import AddInquiry from './components/merchandiser/AddInquiry.jsx';
// import DetailsInquiry from './components/merchandiser/DetailsInquiry.jsx';
// import AddAttachmentInquiry from './components/merchandiser/AddAttachmentInquiry.jsx';
// import InterviewDetailsPage from "./components/hr/Interviews.jsx";
// import ProtectedRoute from "./components/hr/ProtectedRoute";

// // Protected Route Component (Prevents Unauthorized Access)
// const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   return token ? children : <Navigate to="/" replace />;
// };
// // Redirect Logged-in Users from Login Page
// const AuthRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   return token ? <Navigate to="/dashboard" replace /> : children;
// };


// // App Content with Navbar Handling
// const AppContent = () => {
//   const location = useLocation();
//   const hideSidebar = location.pathname === "/"; // Hide Navbar on login page

//   return (
//     <>
//       {!hideSidebar && <Sidebar />}
//       <div className="container">
//         <Routes>
//           <Route path="/" element={<AuthRoute><LoginPage /></AuthRoute>} />
//           <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
//           <Route path="/hr-work" element={<ProtectedRoute><HRWorkPage /></ProtectedRoute>} />
//           <Route path="/interviews/details/:id" element={<InterviewDetailsPage />} />
//           <Route path="/employees" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
//           <Route path="/employee/:id" element={<ProtectedRoute><EmployeeDetailPage /></ProtectedRoute>} />
//           <Route path="/edit-employee/:id" element={<ProtectedRoute><EditEmployeePage /></ProtectedRoute>} />
//           <Route path="/performanse_appraisal" element={<ProtectedRoute><PerformanseAppraisal /></ProtectedRoute>} />
//           <Route path="/performanse_appraisal/:id" element={<ProtectedRoute><PerformanseAppraisal /></ProtectedRoute>} />
//           <Route path="/add-newAppraisal" element={<ProtectedRoute><NewAppraisal /></ProtectedRoute>} />
//           <Route path="/appraisal-details/:id" element={<ProtectedRoute><AppraisalDetails /></ProtectedRoute>} />
//           <Route path="/edit-appraisal/:id" element={<ProtectedRoute><EditAppraisal /></ProtectedRoute>} />
//           <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
//           <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
//           <Route path="/employee_leave_balance" element={<ProtectedRoute><EmployeeLeaveBalance /></ProtectedRoute>} />
//           <Route path="/add-leave-request" element={<ProtectedRoute><AddLeaveRequest /></ProtectedRoute>} />
//           <Route path="/leave-request-details/:id" element={<ProtectedRoute><LeaveRequestDetails /></ProtectedRoute>} />
//           <Route path="/edit-leave-request/:id" element={<ProtectedRoute><EditLeaveRequest /></ProtectedRoute>} />
//           <Route path="/employee_leave_type" element={<ProtectedRoute><EmployeeLeaveType /></ProtectedRoute>} />
//           <Route path="/employee_leave" element={<ProtectedRoute><EmployeeLeave /></ProtectedRoute>} />
//           <Route path="/email-logs" element={<ProtectedRoute><EmailLog /></ProtectedRoute>} />
//           <Route path="/add-employee" element={<ProtectedRoute><AddEmployee /></ProtectedRoute>} />
//           <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
//           <Route path="/interviews/:id" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
//           <Route path="/DashboardPage" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
//           <Route path="/letter-send" element={<LetterSend />} />
//           <Route path="/cv-add" element={<CVAdd />} />
//           <Route path="/it-provision" element={<ITProvision />} />
//           <Route path="/admin-provision" element={<AdminProvision />} />
//           <Route path="/finance-provision" element={<FinanceProvision />} />
//           <Route path="/add-letter" element={<AddLetterPage />} />
//           <Route path="/cv-list" element={<CVList />} />
//           <Route path="/cv-edit/:id" element={<CVEdit />} />
//           <Route path="/edit-cv/:cvId" element={<EditCVPage />} />
//           <Route path="/employee/:id/attachments" element={<EmployeeAttachments />} />
//           <Route path="/tad-groups" element={<ProtectedRoute><TADGroups /></ProtectedRoute>} />
//           <Route path="/employee-termination" element={<ProtectedRoute><EmployeeTermination /></ProtectedRoute>} />
//           <Route path="/attachments/:id" element={<TerminationAttachment />} />
//           <Route path="/cv-detail/:id" element={<CVDetail />} />
//           <Route path="/mailmdsir" element={<MailMdSir />} />
//           <Route path="/invitemail" element={<InviteMail />} />
//           <Route path="/customers" element={<CustomerPage />} />
//           <Route path="/buyers" element={<BuyerPage />} />
//           <Route path="/agents" element={<AgentPage />} />
//           <Route path="/add-agent" element={<AddAgents />} />
//           <Route path="/edit-agent/:id" element={<EditAgents />} />
//           <Route path="/add-buyer" element={<ProtectedRoute><AddBuyer /></ProtectedRoute>} />
//           <Route path="/edit-buyer/:id" element={<EditBuyer />} />
//           <Route path="/add-customer" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
//           <Route path="/edit-customer/:id" element={<EditCustomer />} />
//           <Route path="/suppliers" element={<Supplier />} />
//           <Route path="/add-supplier" element={<AddSupplier />} />
//           <Route path="/edit/suppliers/:id" element={<EditSupplier />} />
//           <Route path="/suppliers/:id" element={<DetailSupplier />} />
//           <Route path="/inquiries" element={<Inquiry />} />
//           <Route path="/inquiries/add" element={<AddInquiry />} />
//           <Route path="/inquiries/:id" element={<DetailsInquiry />} />
//           <Route path="/inquiries/:id/edit" element={<EditInquiry />} />
//           <Route path="/inquiries/attachments" element={<AddAttachmentInquiry />} />
//         </Routes>
//       </div>
//     </>
//   );
// };

// // Main App Component
// const App = () => {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// };

// export default App;



import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/hr/Sidebar";
import ProtectedRoute from "./components/hr/ProtectedRoute";
import LoginPage from "./components/hr/LoginPage";

// HR Pages
import DashboardPage from "./components/hr/DashboardPage";
import HRWorkPage from "./components/hr/HRWorkPage";
import EmployeeDetails from "./components/hr/EmployeeDetails";
import EmployeeDetailPage from "./components/hr/EmployeeDetailPage";
import EditEmployeePage from "./components/hr/EditEmployeePage";
import Notifications from "./components/hr/Notifications";
import Attendance from "./components/hr/Attendance";
import EmailLog from "./components/hr/EmailLog";
import AddEmployee from "./components/hr/AddEmployee";
import Interviews from "./components/hr/Interviews";
import InterviewDetailsPage from "./components/hr/Interviews";
import PerformanseAppraisal from "./components/hr/PerformanseAppraisal";
import NewAppraisal from "./components/hr/NewAppraisal";
import AppraisalDetails from "./components/hr/AppraisalDetails";
import EditAppraisal from "./components/hr/EditAppraisal";
import EmployeeLeaveBalance from "./components/hr/EmployeeLeaveBalance";
import EmployeeLeaveType from "./components/hr/EmployeeLeaveType";
import EmployeeLeave from "./components/hr/EmployeeLeave";
import AddLeaveRequest from "./components/hr/AddLeaveRequest";
import LeaveRequestDetails from "./components/hr/LeaveRequestDetails";
import EditLeaveRequest from "./components/hr/EditLeaveRequest";
import LetterSend from "./components/hr/LetterSend";
import CVAdd from "./components/hr/CVAdd";
import ITProvision from "./components/hr/ITProvision";
import AdminProvision from "./components/hr/AdminProvision";
import FinanceProvision from "./components/hr/FinanceProvision";
import AddLetterPage from "./components/hr/AddLetterPage";
import CVList from "./components/hr/CVList";
import CVEdit from "./components/hr/CVEdit";
import EditCVPage from "./components/hr/EditCVPage";
import EmployeeAttachments from "./components/hr/EmployeeAttachments";
import TADGroups from "./components/hr/TADGroups";
import EmployeeTermination from "./components/hr/EmployeeTermination";
import TerminationAttachment from "./components/hr/TerminationAttachment";
import CVDetail from "./components/hr/CVDetail";
import MailMdSir from "./components/hr/MailMdSir";
import InviteMail from "./components/hr/InviteMail";

// Merchandiser
import CustomerPage from "./components/merchandiser/CustomerPage";
import BuyerPage from "./components/merchandiser/BuyerPage";
import AgentPage from "./components/merchandiser/AgentPage";
import AddAgents from "./components/merchandiser/AddAgents";
import EditAgents from "./components/merchandiser/EditAgents";
import AddBuyer from "./components/merchandiser/AddBuyer";
import EditBuyer from "./components/merchandiser/EditBuyer";
import AddCustomer from "./components/merchandiser/AddCustomer";
import EditCustomer from "./components/merchandiser/EditCustomer";
import Supplier from "./components/merchandiser/Supplier";
import AddSupplier from "./components/merchandiser/AddSupplier";
import EditSupplier from "./components/merchandiser/EditSupplier";
import DetailSupplier from "./components/merchandiser/DetailSupplier";
import Inquiry from "./components/merchandiser/Inquiry";
import AddInquiry from "./components/merchandiser/AddInquiry";
import EditInquiry from "./components/merchandiser/EditInquiry";
import DetailsInquiry from "./components/merchandiser/DetailsInquiry";
import AddAttachmentInquiry from "./components/merchandiser/AddAttachmentInquiry";

import "./styles/App.css";

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <>
      {!isLoginPage && <Sidebar />}
      <div className="container">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected HR Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/hr-work" element={<ProtectedRoute><HRWorkPage /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
          <Route path="/employee/:id" element={<ProtectedRoute><EmployeeDetailPage /></ProtectedRoute>} />
          <Route path="/edit-employee/:id" element={<ProtectedRoute><EditEmployeePage /></ProtectedRoute>} />
          <Route path="/performanse_appraisal" element={<ProtectedRoute><PerformanseAppraisal /></ProtectedRoute>} />
          <Route path="/performanse_appraisal/:id" element={<ProtectedRoute><PerformanseAppraisal /></ProtectedRoute>} />
          <Route path="/add-newAppraisal" element={<ProtectedRoute><NewAppraisal /></ProtectedRoute>} />
          <Route path="/appraisal-details/:id" element={<ProtectedRoute><AppraisalDetails /></ProtectedRoute>} />
          <Route path="/edit-appraisal/:id" element={<ProtectedRoute><EditAppraisal /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/employee_leave_balance" element={<ProtectedRoute><EmployeeLeaveBalance /></ProtectedRoute>} />
          <Route path="/add-leave-request" element={<ProtectedRoute><AddLeaveRequest /></ProtectedRoute>} />
          <Route path="/leave-request-details/:id" element={<ProtectedRoute><LeaveRequestDetails /></ProtectedRoute>} />
          <Route path="/edit-leave-request/:id" element={<ProtectedRoute><EditLeaveRequest /></ProtectedRoute>} />
          <Route path="/employee_leave_type" element={<ProtectedRoute><EmployeeLeaveType /></ProtectedRoute>} />
          <Route path="/employee_leave" element={<ProtectedRoute><EmployeeLeave /></ProtectedRoute>} />
          <Route path="/email-logs" element={<ProtectedRoute><EmailLog /></ProtectedRoute>} />
          <Route path="/add-employee" element={<ProtectedRoute><AddEmployee /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/interviews/:id" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/interviews/details/:id" element={<ProtectedRoute><InterviewDetailsPage /></ProtectedRoute>} />
          <Route path="/tad-groups" element={<ProtectedRoute><TADGroups /></ProtectedRoute>} />
          <Route path="/employee-termination" element={<ProtectedRoute><EmployeeTermination /></ProtectedRoute>} />

          {/* Optional Routes (unprotected or publicly safe) */}
          <Route path="/letter-send" element={<ProtectedRoute><LetterSend /></ProtectedRoute>} />
          <Route path="/cv-add" element={<ProtectedRoute><CVAdd /></ProtectedRoute>} />
          <Route path="/it-provision" element={<ProtectedRoute><ITProvision /></ProtectedRoute>} />
          <Route path="/admin-provision" element={<ProtectedRoute><AdminProvision /></ProtectedRoute>} />
          <Route path="/finance-provision" element={<ProtectedRoute><FinanceProvision /></ProtectedRoute>} />
          <Route path="/add-letter" element={<ProtectedRoute><AddLetterPage /></ProtectedRoute>} />
          <Route path="/cv-list" element={<ProtectedRoute><CVList /></ProtectedRoute>} />
          <Route path="/cv-edit/:id" element={<ProtectedRoute><CVEdit /></ProtectedRoute>} />
          <Route path="/edit-cv/:cvId" element={<ProtectedRoute><EditCVPage /></ProtectedRoute>} />
          <Route path="/employee/:id/attachments" element={<ProtectedRoute><EmployeeAttachments /></ProtectedRoute>} />
          <Route path="/attachments/:id" element={<ProtectedRoute><TerminationAttachment /></ProtectedRoute>} />
          <Route path="/cv-detail/:id" element={<ProtectedRoute><CVDetail /></ProtectedRoute>} />
          <Route path="/mailmdsir" element={<ProtectedRoute><MailMdSir /></ProtectedRoute>} />
          <Route path="/invitemail" element={<ProtectedRoute><InviteMail /></ProtectedRoute>} />

          {/* Merchandiser Section (protect more if needed) */}
          <Route path="/customers" element={<ProtectedRoute><CustomerPage /></ProtectedRoute>} />
          <Route path="/buyers" element={<ProtectedRoute><BuyerPage /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><AgentPage /></ProtectedRoute>} />
          <Route path="/add-agent" element={<ProtectedRoute><AddAgents /></ProtectedRoute>} />
          <Route path="/edit-agent/:id" element={<ProtectedRoute><EditAgents /></ProtectedRoute>} />
          <Route path="/add-buyer" element={<ProtectedRoute><AddBuyer /></ProtectedRoute>} />
          <Route path="/edit-buyer/:id" element={<ProtectedRoute><EditBuyer /></ProtectedRoute>} />
          <Route path="/add-customer" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
          <Route path="/edit-customer/:id" element={<ProtectedRoute><EditCustomer /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Supplier /></ProtectedRoute>} />
          <Route path="/add-supplier" element={<ProtectedRoute><AddSupplier /></ProtectedRoute>} />
          <Route path="/edit/suppliers/:id" element={<ProtectedRoute><EditSupplier /></ProtectedRoute>} />
          <Route path="/suppliers/:id" element={<ProtectedRoute><DetailSupplier /></ProtectedRoute>} />
          <Route path="/inquiries" element={<ProtectedRoute><Inquiry /></ProtectedRoute>} />
          <Route path="/inquiries/add" element={<ProtectedRoute><AddInquiry /></ProtectedRoute>} />
          <Route path="/inquiries/:id" element={<ProtectedRoute><DetailsInquiry /></ProtectedRoute>} />
          <Route path="/inquiries/:id/edit" element={<ProtectedRoute><EditInquiry /></ProtectedRoute>} />
          <Route path="/inquiries/attachments" element={<ProtectedRoute><AddAttachmentInquiry /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
