


import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/hr/Sidebar";
import ProtectedRoute from "./components/hr/ProtectedRoute";
import ProtectedRouteForAll from "./components/hr/ProtectedRouteForAll";
import LoginPage from "./components/hr/LoginPage";

// HR Pages
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

import AdminProvision from "./components/hr/AdminProvision";
import FinanceProvision from "./components/tax/FinanceProvision";
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
import WeeklyAttendanceGraph from "./components/hr/WeeklyAttendanceGraph.jsx";
import HolidaysPage from "./components/hr/HolidaysPage.jsx";
import TerminatedEmployeeArchive from "./components/hr/TerminatedEmployeeArchive.jsx";


//regular user Dashboard
import Dashboard from "./components/hr/regular_user/Dashboard.jsx";
import ApplyLeave from "./components/hr/regular_user/ApplyLeave.jsx";
import PerformanceAppraisal from "./components/hr/regular_user/PerformanceAppraisal.jsx";
import TeamLeaves from "./components/hr/regular_user/TeamLeaves.jsx";

// Merchandiser
import DashboardPage from "./components/merchandiser/DashboardPage";
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
import BuyerDetails from "./components/merchandiser/BuyerDetails.jsx";
import CustomerDetailsPage from "./components/merchandiser/CustomerDetailsPage.jsx";

//CSR Pages
import DashboardCSR from "./components/csr/DashboardCSR.jsx";
import AddSupplierCSR from "./components/csr/AddSupplierCSR.jsx";
import EditSupplierCSR from "./components/csr/EditSupplierCSR.jsx";
import SupplierListCSR from "./components/csr/SupplierListCSR.jsx";
import SupplierDetailsCSR from "./components/csr/SupplierDetailsCSR.jsx";


// Tax Calculator
// import TaxCalculator from "./components/tax/TaxCalculator.jsx";
import TaxCalculators from "./components/tax/TaxCalculators.jsx";
import SalaryFormat from "./components/tax/SalaryFormat.jsx";
import LeaveHistory from "./components/hr/regular_user/LeaveHistory.jsx";
import SalaryRecords from "./components/tax/SalaryRecords.jsx";

// Stationery Management
import StationeryDashboard from "./components/stationery/StationeryDashboard.jsx";
import RegularUserStationery from "./components/stationery/RegularUserStationery.jsx";
import StationeryItems from "./components/stationery/StationeryItems.jsx";
import StationeryUsage from "./components/stationery/StationeryUsage.jsx";
import StockReport from "./components/stationery/StockReport.jsx";

// chatbox 
import ChatApp from "./components/chatbox/ChatApp.jsx";

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

          {/* Protected HR Routes (Full Access Only - will be checked in backend) */}
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
          <Route path="/weekly-attendance-graph" element={<ProtectedRoute><WeeklyAttendanceGraph /></ProtectedRoute>} />
          <Route path="/holidays" element={<ProtectedRoute><HolidaysPage /></ProtectedRoute>} />
          <Route path="/terminated-employee-archive" element={<ProtectedRoute><TerminatedEmployeeArchive /></ProtectedRoute>} />
         

          {/* Regular User Routes (Accessible to ALL authenticated users) */} 
          <Route path="/apply-leave" element={<ProtectedRouteForAll><ApplyLeave /></ProtectedRouteForAll>} />
          <Route path="/dashboard" element={<ProtectedRouteForAll><Dashboard /></ProtectedRouteForAll>}/>
          <Route path="/performance-appraisal" element={<ProtectedRouteForAll><PerformanceAppraisal /></ProtectedRouteForAll>} />
          <Route path="/leave-history" element={<ProtectedRouteForAll><LeaveHistory /></ProtectedRouteForAll>} />
          <Route path="/team-leaves" element={<ProtectedRouteForAll><TeamLeaves /></ProtectedRouteForAll>} />
          <Route path="/salary-records" element={<ProtectedRouteForAll><SalaryRecords /></ProtectedRouteForAll>} />

          {/* StationaryDashboard */}
          <Route path="/StationeryDashboard" element={<ProtectedRouteForAll><StationeryDashboard /></ProtectedRouteForAll>} />
          <Route path="/RegularUserStationery" element={<ProtectedRouteForAll><RegularUserStationery /></ProtectedRouteForAll>} />
          <Route path="/StationeryItems" element={<ProtectedRouteForAll><StationeryItems /></ProtectedRouteForAll>} />
          <Route path="/StationeryUsage" element={<ProtectedRouteForAll><StationeryUsage /></ProtectedRouteForAll>} />
          <Route path="/StockReport" element={<ProtectedRouteForAll><StockReport /></ProtectedRouteForAll>} />

          {/* Chat - Accessible to ALL */}
          <Route path="/chat" element={<ProtectedRouteForAll><ChatApp /></ProtectedRouteForAll>} />

          {/* Optional Routes (protect based on your needs) */}
          <Route path="/letter-send" element={<ProtectedRoute><LetterSend /></ProtectedRoute>} />
          <Route path="/cv-add" element={<ProtectedRoute><CVAdd /></ProtectedRoute>} />
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

          {/* Merchandiser Section (protect based on your needs) */}
          <Route path="/merchandiser-dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
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
          <Route path="/buyer-details/:id" element={<ProtectedRoute><BuyerDetails /></ProtectedRoute>} />
          <Route path="/customer-details/:id" element={<ProtectedRoute><CustomerDetailsPage /></ProtectedRoute>} />
          {/* Tax Calculator Section (protect based on your needs) */}
          {/* <Route path="/tax-calculator" element={<ProtectedRoute><TaxCalculator /></ProtectedRoute>} /> */}
          <Route path="/tax-calculator/:employeeId" element={<ProtectedRoute><TaxCalculators /></ProtectedRoute>} />
          <Route path="/salary-format" element={<ProtectedRoute><SalaryFormat /></ProtectedRoute>} />


          {/* CSR Section (protect based on your needs) */}
          <Route path="/csr-dashboard" element={<ProtectedRoute><DashboardCSR /></ProtectedRoute>} />
          <Route path="/suppliersCSR" element={<ProtectedRoute><SupplierListCSR /></ProtectedRoute>} />
          <Route path="/add-supplierCSR" element={<ProtectedRoute><AddSupplierCSR /></ProtectedRoute>} />
          <Route path="/edit-supplier/:id" element={<ProtectedRoute><EditSupplierCSR /></ProtectedRoute>} />
          <Route path="/suppliersCSR/:id" element={<ProtectedRoute><SupplierDetailsCSR /></ProtectedRoute>} />
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