/**
 * pages.config.js - Page routing configuration
 */
import AIAdminAssistant from './pages/AIAdminAssistant';
import AIAssistant from './pages/AIAssistant';
import Admin from './pages/Admin';
import AdminApprovalsFinancials from './pages/AdminApprovalsFinancials';
import AppDownloads from './pages/AppDownloads';
import ApprovalsAndFinancials from './pages/ApprovalsAndFinancials';
import Archive from './pages/Archive';
import Assets from './pages/Assets';
import CareLogs from './pages/CareLogs';
import Chat from './pages/Chat';
import ClientManagement from './pages/ClientManagement';
import ClockInOut from './pages/ClockInOut';
import CommunicationArchive from './pages/CommunicationArchive';
import Communications from './pages/Communications';
import ComplianceManagement from './pages/ComplianceManagement';
import DataImport from './pages/DataImport';
import Dashboard from './pages/Dashboard';
import DocumentManagement from './pages/DocumentManagement';
import Documents from './pages/Documents';
import ErrorLog from './pages/ErrorLog';
import Expenses from './pages/Expenses';
import FormBuilder from './pages/FormBuilder';
import HowToUseApp from './pages/HowToUseApp';
import Incidents from './pages/Incidents';
import Invoicing from './pages/Invoicing';
import LeaveManagement from './pages/LeaveManagement';
import LeaveRequests from './pages/LeaveRequests';
import Messages from './pages/Messages';
import NotificationCenter from './pages/NotificationCenter';
import Payroll from './pages/Payroll';
import Profile from './pages/Profile';
import PushNotificationManagement from './pages/PushNotificationManagement';
import Reports from './pages/Reports';
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
import CourseSeeder from './pages/CourseSeeder';
import OrgAdmin from './pages/OrgAdmin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAdminAssistant": AIAdminAssistant,
    "AIAssistant": AIAssistant,
    "Admin": Admin,
    "AdminApprovalsFinancials": AdminApprovalsFinancials,
    "AppDownloads": AppDownloads,
    "ApprovalsAndFinancials": ApprovalsAndFinancials,
    "Archive": Archive,
    "Assets": Assets,
    "CareLogs": CareLogs,
    "Chat": Chat,
    "ClientManagement": ClientManagement,
    "ClockInOut": ClockInOut,
    "CommunicationArchive": CommunicationArchive,
    "Communications": Communications,
    "ComplianceManagement": ComplianceManagement,
    "DataImport": DataImport,
    "Dashboard": Dashboard,
    "DocumentManagement": DocumentManagement,
    "Documents": Documents,
    "ErrorLog": ErrorLog,
    "Expenses": Expenses,
    "FormBuilder": FormBuilder,
    "HowToUseApp": HowToUseApp,
    "Incidents": Incidents,
    "Invoicing": Invoicing,
    "LeaveManagement": LeaveManagement,
    "LeaveRequests": LeaveRequests,
    "Messages": Messages,
    "NotificationCenter": NotificationCenter,
    "Payroll": Payroll,
    "Profile": Profile,
    "PushNotificationManagement": PushNotificationManagement,
    "Reports": Reports,
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
    "CourseSeeder": CourseSeeder,
    "OrgAdmin": OrgAdmin,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
