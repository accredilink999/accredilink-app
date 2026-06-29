/**
 * pages.config.js - Page routing configuration
 */
import AIAdminAssistant from './pages/AIAdminAssistant';
import AIAssistant from './pages/AIAssistant';
import Admin from './pages/Admin';
import AdminApprovalsFinancials from './pages/AdminApprovalsFinancials';
import ApprovalsAndFinancials from './pages/ApprovalsAndFinancials';
import AppDownloads from './pages/AppDownloads';
import Assets from './pages/Assets';
import CareLogs from './pages/CareLogs';
import ClientManagement from './pages/ClientManagement';
import ClockInOut from './pages/ClockInOut';
import ComplianceManagement from './pages/ComplianceManagement';
import DataImport from './pages/DataImport';
import Dashboard from './pages/Dashboard';
import DocumentManagement from './pages/DocumentManagement';
import Documents from './pages/Documents';
import Expenses from './pages/Expenses';
import Finance from './pages/Finance';
import FormBuilder from './pages/FormBuilder';
import HowToUseApp from './pages/HowToUseApp';
import Incidents from './pages/Incidents';
import Invoicing from './pages/Invoicing';
import LeaveManagement from './pages/LeaveManagement';
import LeaveRequests from './pages/LeaveRequests';
import NotificationCenter from './pages/NotificationCenter';
import Payroll from './pages/Payroll';
import Competencies from './pages/Competencies';
import Profile from './pages/Profile';
import RequestsManagement from './pages/RequestsManagement';
import Rota from './pages/Rota';
import RotaManagement from './pages/RotaManagement';
import Settings from './pages/Settings';
import StaffManagement from './pages/StaffManagement';
import Training from './pages/Training';
import TrainingMatrix from './pages/TrainingMatrix';
import WorkCalendar from './pages/WorkCalendar';
import ClinicalDashboard from './pages/ClinicalDashboard';
import ControlRoom from './pages/ControlRoom';
import OrgAdmin from './pages/OrgAdmin';
import StaffAwards from './pages/StaffAwards';
import MyMentoring from './pages/MyMentoring';
import TwoWayRadio from './pages/TwoWayRadio';
import CompetencyHub from './pages/CompetencyHub';
import Feedback from './pages/Feedback';
import StaffLeaderboard from './pages/StaffLeaderboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAdminAssistant": AIAdminAssistant,
    "AIAssistant": AIAssistant,
    "Admin": Admin,
    "AdminApprovalsFinancials": AdminApprovalsFinancials,
    "ApprovalsAndFinancials": ApprovalsAndFinancials,
    "AppDownloads": AppDownloads,
    "Assets": Assets,
    "CareLogs": CareLogs,
    "Competencies": Competencies,
    "ClientManagement": ClientManagement,
    "Feedback": Feedback,
    "ClockInOut": ClockInOut,
    "ComplianceManagement": ComplianceManagement,
    "DataImport": DataImport,
    "Dashboard": Dashboard,
    "DocumentManagement": DocumentManagement,
    "Documents": Documents,
    "Expenses": Expenses,
    "Finance": Finance,
    "FormBuilder": FormBuilder,
    "HowToUseApp": HowToUseApp,
    "Incidents": Incidents,
    "Invoicing": Invoicing,
    "LeaveManagement": LeaveManagement,
    "LeaveRequests": LeaveRequests,
    "MyMentoring": MyMentoring,
    "NotificationCenter": NotificationCenter,
    "Payroll": Payroll,
    "Profile": Profile,
    "RequestsManagement": RequestsManagement,
    "Rota": Rota,
    "RotaManagement": RotaManagement,
    "Settings": Settings,
    "StaffManagement": StaffManagement,
    "Training": Training,
    "TrainingMatrix": TrainingMatrix,
    "WorkCalendar": WorkCalendar,
    "ClinicalDashboard": ClinicalDashboard,
    "ControlRoom": ControlRoom,
    "OrgAdmin": OrgAdmin,
    "StaffAwards": StaffAwards,
    "StaffLeaderboard": StaffLeaderboard,
    "TwoWayRadio": TwoWayRadio,
    "CompetencyHub": CompetencyHub,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
