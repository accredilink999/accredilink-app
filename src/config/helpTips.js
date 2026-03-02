/**
 * helpTips.js — Contextual help text for all pages and sections.
 * Used by PageHeader and HelpTip components when help mode is toggled ON.
 */

// Page-level help tips keyed by page title
export const PAGE_TIPS = {
  'Dashboard': 'Your home screen — see today\'s shifts, notifications, care tasks, and quick actions all in one place. Tap any card to jump straight to that section.',
  'Admin Panel': 'Central hub for all admin functions. From here you can manage staff, clients, rota, compliance, and more. Only visible to admin and manager roles.',
  'Organisation Admin': 'Manage your organisation settings, staff roles, billing & subscription, and company details. Only org owners and admins can access this.',
  'Staff Management': 'View and manage all staff profiles, contracts, DBS checks, and employment details. Use the Teams tab to organise staff into teams, and Onboard to add multiple new starters at once.',
  'Client Management': 'Manage your service users (clients). Add new clients, view care plans, track incidents, and see care log history. Filter by area to find clients quickly.',
  'Rota': 'View and manage the staff rota. Switch between day, week, and month views. Admins can create shifts, deploy patterns, and manage shift types. Staff can view their shifts and claim available cover.',
  'Rota Management': 'Advanced rota settings — manage shift types, base shift templates, and recurring patterns. Set up your rota structure here, then deploy it to the calendar.',
  'Care Logs': 'View and create daily care records for service users. Each log captures mood, food/fluid intake, personal care, and health observations during visits.',
  'Training': 'Manage staff training courses and certifications. Track mandatory training completion, set expiry dates, and use the AI course builder to create custom training content.',
  'Training Matrix': 'See a grid view of all staff training status at a glance. Quickly identify who needs to complete or renew their training courses.',
  'Compliance Management': 'Track CIW/CQC regulatory compliance. View regulations, file evidence, schedule inspections, and monitor your compliance status across all regulatory areas.',
  'Incidents': 'Report and manage incidents including falls, medication errors, safeguarding concerns, and near misses. Track investigations and outcomes for each incident.',
  'Documents': 'Upload and manage staff documents (DBS, contracts, certificates) and company policies. Set document requirements so staff know what to upload.',
  'Document Management': 'Admin view of all documents across the organisation. Review, approve, and manage document expiry and compliance.',
  'Messages': 'Send and receive messages with your team. Create group conversations, share announcements, and keep all work communication in one place.',
  'Communications': 'Manage official communications — announcements, newsletters, and broadcast messages to all staff or specific teams.',
  'Settings': 'Manage your personal account settings, notifications, security options, and app preferences. Admins can also configure organisation-wide settings here.',
  'Reports': 'Generate reports on staff hours, care delivery, incidents, training compliance, and more. Export to PDF or CSV for CIW/CQC evidence.',
  'Invoicing': 'Create and manage invoices for client care. Set up recurring invoices, track payments, and generate financial reports.',
  'Expenses': 'Submit and manage staff expense claims. Upload receipts, track approval status, and export for payroll processing.',
  'Payroll': 'View payroll summaries based on completed shifts. Calculate hours, overtime, and generate payroll exports.',
  'Leave Management': 'Manage staff leave requests, approvals, and holiday balances. View team availability and plan cover for absences.',
  'Leave Requests': 'Submit and track your leave requests. View your remaining holiday balance and request time off.',
  'Work Calendar': 'Personal work calendar showing your scheduled shifts, leave, training, and important dates.',
  'Clock In/Out': 'Clock in and out of shifts with GPS verification. Your location is recorded for compliance and lone worker safety.',
  'Chat': 'Real-time messaging with colleagues. Send text, images, and files in private or group conversations.',
  'Notification Center': 'View all your notifications in one place — shift reminders, approvals, announcements, and system alerts.',
  'Profile': 'View and edit your personal profile, contact details, emergency contacts, and employment information.',
  'Assets': 'Track company equipment and assets assigned to staff or locations. Log maintenance and depreciation.',
  'Clinical Dashboard': 'Clinical overview showing health observations, eMAR records, wound care tracking, and clinical alerts across all service users.',
  'Control Room': 'Real-time operational dashboard — see live shift status, staff locations, alerts, and key metrics at a glance.',
  'Archive': 'Access archived records — past clients, completed incidents, old care logs, and historical data.',
  'AI Assistant': 'Ask the AI assistant questions about care regulations, policies, or get help drafting documents. Powered by AI trained on CIW/CQC guidance.',
  'Form Builder': 'Create custom forms for care assessments, audits, and data collection. Design forms with drag-and-drop fields.',
  'App Downloads': 'Download the CareCall AI mobile app for iOS and Android. Get push notifications and offline access.',
  'Data Import': 'Import existing data from spreadsheets or other systems. Map fields and bulk-upload staff, clients, and shift data.',
  'How to Use This App': 'Step-by-step guides on how to use every feature in CareCall AI. Great for new starters and refresher training.',
  'Error Log': 'View system error logs for debugging. Only visible to super admins.',
  'Push Notifications': 'Configure push notification settings, manage notification channels, and test delivery to devices.',
  'Requests Management': 'View and manage all pending requests — shift swaps, leave requests, overtime approvals, and more.',
  'Approvals & Financials': 'Review and approve financial items — expense claims, mileage, overtime, and invoice adjustments.',
};

// Section-level tips for common UI elements
export const SECTION_TIPS = {
  // Dashboard sections
  'stats_cards': 'Quick overview of today\'s key numbers. Tap any card to see more detail.',
  'todays_shifts': 'Shifts scheduled for today. Green = completed, blue = in progress, grey = upcoming.',
  'notifications_banner': 'Important alerts that need your attention — tap to view details.',
  'quick_actions': 'Shortcuts to common tasks. These change based on your role.',

  // Rota sections
  'rota_views': 'Switch between Day, Week, and Month views to see the rota from different angles.',
  'area_selector': 'Filter the rota by care area. Each area has its own set of shifts and staff.',
  'pattern_manager': 'Set up recurring shift patterns (e.g. 4-on-4-off). Deploy them to auto-fill the rota.',
  'shift_types': 'Define the types of shifts your organisation uses (e.g. Morning, Afternoon, Night, Sleep-in).',

  // Staff sections
  'staff_directory': 'All staff members listed here. Tap a name to see their full profile with contracts, training, and documents.',
  'teams': 'Organise staff into teams for easier rota management and communication.',
  'onboard': 'Quickly add multiple new staff members at once. Enter their details and they\'ll receive login invitations.',

  // Client sections
  'client_list': 'All your service users. Use search and filters to find specific clients. Tap to view care plans and history.',
  'care_plan': 'The client\'s personalised care plan — what support they need, preferences, risks, and goals.',

  // Compliance sections
  'regulations': 'CIW and CQC regulations relevant to your service. Each regulation shows its requirements and your compliance status.',
  'evidence_filing': 'Upload evidence documents to prove compliance with each regulation. This builds your inspection-ready portfolio.',

  // Training sections
  'course_library': 'Browse available training courses. Mandatory courses are highlighted. AI can generate custom courses for your needs.',
  'my_courses': 'Your assigned courses with completion status. Tap to start or continue a course.',

  // Settings sections
  'billing': 'Manage your subscription plan, payment method, and view invoices. Upgrade or downgrade at any time.',
  'notifications_settings': 'Choose which notifications you receive and how — push, email, or in-app.',
  'security': 'Set up biometric login, change your password, and manage security preferences.',
};
