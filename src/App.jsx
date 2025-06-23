import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/hr/Sidebar";
import EmployeeDetails from "./components/hr/EmployeeDetails";
import Notifications from "./components/hr/Notifications";
import Attendance from "./components/hr/Attendance";
import EmailLog from "./components/hr/EmailLog";
import "./styles/App.css";
import EmployeeDetailPage from "./components/hr/EmployeeDetailPage";
import EditEmployeePage from "./components/hr/EditEmployeePage";
import LoginPage from "./components/hr/LoginPage";
import AddEmployee from "./components/hr/AddEmployee";
import Interviews from "./components/hr/Interviews";
import HRWorkPage from './components/hr/HRWorkPage';
import DashboardPage from './components/hr/DashboardPage';
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
import TerminationAttachment from "./components/hr/TerminationAttachment"
import CVDetail from "./components/hr/CVDetail";
import MailMdSir from "./components/hr/MailMdSir";
import InviteMail from "./components/hr/InviteMail"
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
import CustomerPage from "./components/merchandiser/CustomerPage";
import BuyerPage from "./components/merchandiser/BuyerPage";
import AgentPage from "./components/merchandiser/AgentPage";
import AddAgents from "./components/merchandiser/AddAgents";
import EditAgents from "./components/merchandiser/EditAgents";
import AddBuyer from "./components/merchandiser/AddBuyer";
import EditBuyer from "./components/merchandiser/EditBuyer";
import AddCustomer from "./components/merchandiser/AddCustomer";
import EditCustomer from "./components/merchandiser/EditCustomer";
import Supplier from './components/merchandiser/Supplier';
import AddSupplier from './components/merchandiser/AddSupplier';
import EditSupplier from './components/merchandiser/EditSupplier';
import DetailSupplier from './components/merchandiser/DetailSupplier.jsx';
import Inquiry from './components/merchandiser/Inquiry.jsx';
import EditInquiry from './components/merchandiser/EditInquiry.jsx';
import AddInquiry from './components/merchandiser/AddInquiry.jsx';
import DetailsInquiry from './components/merchandiser/DetailsInquiry.jsx';
import AddAttachmentInquiry from './components/merchandiser/AddAttachmentInquiry.jsx';

// Protected Route Component (Prevents Unauthorized Access)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};
// Redirect Logged-in Users from Login Page
const AuthRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : children;
};


// App Content with Navbar Handling
const AppContent = () => {
  const location = useLocation();
  const hideSidebar = location.pathname === "/"; // Hide Navbar on login page

  return (
    <>
      {!hideSidebar && <Sidebar />}
      <div className="container">
        <Routes>
          <Route path="/" element={<AuthRoute><LoginPage /></AuthRoute>} />
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
          <Route path="/DashboardPage" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/letter-send" element={<LetterSend />} />
          <Route path="/cv-add" element={<CVAdd />} />
          <Route path="/it-provision" element={<ITProvision />} />
          <Route path="/admin-provision" element={<AdminProvision />} />
          <Route path="/finance-provision" element={<FinanceProvision />} />
          <Route path="/add-letter" element={<AddLetterPage />} />
          <Route path="/cv-list" element={<CVList />} />
          <Route path="/cv-edit/:id" element={<CVEdit />} />
          <Route path="/edit-cv/:cvId" element={<EditCVPage />} />
          <Route path="/employee/:id/attachments" element={<EmployeeAttachments />} />
          <Route path="/tad-groups" element={<ProtectedRoute><TADGroups /></ProtectedRoute>} />
          <Route path="/employee-termination" element={<ProtectedRoute><EmployeeTermination /></ProtectedRoute>} />
          <Route path="/attachments/:id" element={<TerminationAttachment />} />
          <Route path="/cv-detail/:id" element={<CVDetail />} />
          <Route path="/mailmdsir" element={<MailMdSir />} />
          <Route path="/invitemail" element={<InviteMail />} />
          <Route path="/customers" element={<CustomerPage />} />
          <Route path="/buyers" element={<BuyerPage />} />
          <Route path="/agents" element={<AgentPage />} />
          <Route path="/add-agent" element={<AddAgents />} />
          <Route path="/edit-agent/:id" element={<EditAgents />} />
          <Route path="/add-buyer" element={<ProtectedRoute><AddBuyer /></ProtectedRoute>} />
          <Route path="/edit-buyer/:id" element={<EditBuyer />} />
          <Route path="/add-customer" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
          <Route path="/edit-customer/:id" element={<EditCustomer />} />
          <Route path="/suppliers" element={<Supplier />} />
          <Route path="/add-supplier" element={<AddSupplier />} />
          <Route path="/edit/suppliers/:id" element={<EditSupplier />} />
          <Route path="/suppliers/:id" element={<DetailSupplier />} />
          <Route path="/inquiries" element={<Inquiry />} />
          <Route path="/inquiries/add" element={<AddInquiry />} />
          <Route path="/inquiries/:id" element={<DetailsInquiry />} />
          <Route path="/inquiries/:id/edit" element={<EditInquiry />} />
          <Route path="/inquiries/attachments" element={<AddAttachmentInquiry />} />
        </Routes>
      </div>
    </>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
