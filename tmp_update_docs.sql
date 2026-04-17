UPDATE forum_threads SET content = '# CareCallAI — Complete Setup & User Guide

Welcome to the official CareCallAI documentation. This guide covers everything from initial setup to advanced features, written in the order things need to be done. Use the forum search to find specific topics.

---

## PART 1 — Initial Setup (Do These First)

Follow these steps in order when setting up your CareCallAI account for the first time.

### Step 1 — Create Your Organisation

After signing up you will be prompted to create your organisation. Enter your:

- Company name and registration number
- CIW or CQC registration number
- Office address and contact details
- Your regulatory body (CIW for Wales, CQC for England)

### Step 2 — Set Up Service Areas

Go to **Settings** and create your service areas (e.g. Denbigh, Llangollen). Each area has its own rota, shift types, and staff assignments. This allows you to manage multiple locations from one account.

### Step 3 — Add Staff Members

Go to **Staff** and add each team member. For every staff member you need to enter:

- Full name, email, phone number, and address
- Emergency contacts and next of kin
- Role — Carer, Senior Carer, Manager, or Admin
- DBS certificate number and expiry date
- Right to work documentation
- Start date and contracted hours
- Assigned service area(s)
- Profile photo (optional)

Staff will receive login credentials by email automatically.

### Step 4 — Set Up Staff Pay Rates

For each staff member, go to their profile and open **Employment Details**. You need to configure:

- **Pay Type** — Choose between Hourly Rate or Annual Salary
- **Hourly Rate** — Enter the rate in pounds (e.g. 12.50) if the staff member is paid hourly
- **Annual Salary** — Enter the yearly salary if the staff member is salaried
- **Employment Type** — Full Time, Part Time, Zero Hours, Bank, or Agency
- **Tax Code** — Select the correct PAYE code (default is 1257L)
- **NI Category** — Select A (standard), B (reduced), C (pension age), H (apprentice), or M (under 21)
- **NI Number** — Enter their National Insurance number

> Only Super Admins and Admins can view or edit employment details. Standard staff cannot see pay information.

### Step 5 — Set Up Permissions & Roles

Go to each staff member''s profile to assign their role. CareCallAI has three permission levels:

**Super Admin**
- Full access to everything including payroll, payslips, and billing
- Can promote other staff to Super Admin
- Can manage all settings and configurations
- Cannot change their own role (to prevent lockout)

**Admin**
- Can manage staff records and view hours
- Can approve leave requests and expenses
- Can access the admin panel and reports
- Cannot access payroll or generate payslips

**Staff (Default)**
- Can view their own rota and shifts
- Can submit leave requests and expenses
- Can clock in and out of visits
- Can complete care logs, eMAR, and incident reports
- Cannot see admin areas or other staff records

> To change a staff member''s role, go to their profile and look for the Role section. Only Super Admins can promote staff to Admin or Super Admin.

### Step 6 — Set Up Training Requirements

In **Staff** then **Training**, configure for each staff member:

- Mandatory training courses — manual handling, safeguarding, first aid, medication, infection control
- Completion dates for each course
- Renewal intervals — the system auto-calculates expiry dates
- Alerts are sent at 30 days, 7 days, and on the day of expiry

### Step 7 — Add Service Users (Clients)

Go to **Service Users** and create a profile for each client:

- Personal details — name, date of birth, address, phone
- Emergency contacts and next of kin
- GP details and medical history
- Allergies and dietary requirements
- Communication preferences
- Key safe code and access instructions
- Funding type — council-funded, private, or mixed

### Step 8 — Create Care Plans

For each client, create a care plan covering:

- Personal care needs
- Medication requirements
- Mobility and equipment
- Nutrition and hydration
- Communication and social needs
- Risk assessments

> **Tip:** Use the **AI Assistant** to draft care plans from assessment data. It generates comprehensive first drafts in seconds that you then review and edit.

### Step 9 — Set Up Medications (eMAR)

For each client, go to their profile then **MAR Chart** and add all prescribed medications:

- Medication name and dose
- Frequency and times — Morning, Afternoon, Evening, Night, or PRN (As Needed)
- Route of administration
- Pill pouch indicator if applicable
- Start and end dates
- Special instructions

### Step 10 — Configure Your Rota

Go to **Rota** and set up your schedule:

1. Create **shift types** for your area (e.g. Morning 07:00-14:00, Afternoon 14:00-22:00, Night 22:00-07:00)
2. Create **base templates** — design your ideal week with all shifts
3. **Deploy templates** across date ranges with one click
4. Create **shift patterns** for individual staff (e.g. 2 weeks on, 1 week off)
5. Assign staff to shifts by clicking blank shifts and selecting a staff member

### Step 11 — Set Up Invoicing

Go to **Invoicing** and configure:

- Rate cards — hourly rates per client, call type, and time of day
- Council contract details — PO numbers, framework rates, contract hours
- Private client billing settings
- Invoice frequency — weekly, fortnightly, or monthly

### Step 12 — Set Up Mileage Rate

Go to **Settings** and set the mileage rate in pence per mile (default is 45p/mile). This rate is used when staff submit mileage expenses and is automatically applied to distance calculations.

### Step 13 — Install the Mobile App

Staff can install CareCallAI on their phone by opening the website in their mobile browser and tapping **Add to Home Screen**. This creates an app icon on their phone that works just like a native app.

Log in with the same credentials used on the web. The mobile app provides access to the daily rota, care logging, medication recording, GPS check-in, and incident reporting.

---

## PART 2 — Daily Operations

This section covers what staff do on a daily basis when delivering care.

### Care Visit Workflow

For each client visit, staff should follow this process:

1. **Arrive** at the client''s home
2. **Check In** — tap the Check In button or scan the QR code at the client''s home
3. The system verifies your GPS location and records your arrival time
4. **Deliver care** as per the care plan
5. **Record medications** — open the MAR chart and mark each medication as Given, Refused, Destroyed, Not Available, Hospital, or Self-Administered
6. **Complete care log** — record mood, food intake, fluid intake, personal care tasks, and notes. Attach photos if needed
7. **Check Out** — tap when leaving. Duration and mileage are calculated automatically
8. The manager''s live tracking map updates in real time throughout

### Care Logging — What to Record

Each care log should include:

- Client''s mood and emotional state
- Food intake — what they ate and how much
- Fluid intake — what they drank and how much
- Personal care tasks completed
- Any observations or concerns
- Photos or evidence (optional)

> Care logs are timestamped, attributed to the carer, and cannot be deleted. This creates a complete audit trail for inspections.

### Medication Administration (eMAR)

**Always follow the Six Rights:**

- Right patient
- Right drug
- Right dose
- Right route
- Right time
- Right documentation

**Status options when recording medication:**

- **Given (G)** — medication administered as prescribed
- **Refused (R)** — client declined the medication
- **Destroyed (D)** — medication destroyed (e.g. expired)
- **Not Available** — medication not in stock
- **Hospital** — client is in hospital
- **Self-Administered** — client takes it themselves

Your initials are recorded automatically. PRN (As Needed) medications are tracked separately with a reason for administration.

### Incident Reporting

**When to report:** falls or injuries, medication errors, safeguarding concerns, near misses, equipment failures, complaints.

**How to report:**

1. Go to **Incidents** from the menu
2. Tap **Report Incident**
3. Record the incident type, date and time, location, full description, immediate actions taken, and any witnesses
4. Submit — your manager is notified immediately
5. The incident is timestamped and cannot be edited or deleted

### Chat & Messaging

- Send direct messages to colleagues
- Create group chats for teams
- Share photos, files, and voice notes
- Use reactions and reply threading
- All messages should be professional and work-related

---

## PART 3 — Staff Management

### Rota Management

**Views available:** Day, Week, and Month

**What you can do:**

- Create and assign shifts to staff
- Deploy base templates across any date range
- Set up recurring shift patterns per staff member
- Add one-off calls for unplanned visits
- Track visit status — Not at Home (amber) vs Missed (red)
- View the live staff tracking map

### Staff Supervision

CareCallAI tracks 12-weekly staff supervisions as required by:

- **RISCA Regulation 36** (CIW / Wales)
- **CQC Regulation 18** (England)

**The system automatically:**

- Calculates when each staff member''s next supervision is due
- Sends alerts when supervisions are approaching or overdue
- Provides supervision form templates
- Stores historical supervision records
- The Virtual Inspector flags any missing or overdue supervisions

### Leave Management

Staff submit leave requests through the app. Managers approve or decline from the admin panel. Approved leave automatically removes the staff member from the rota for those dates.

**Leave types:** Annual leave, sick leave, compassionate leave, unpaid leave, training leave

### Expenses & Mileage

**Submitting Expenses (Staff):**

1. Go to **Expenses** then **Submit New**
2. Choose the expense type — Mileage, Fuel, Parking, Meals, Equipment, Training, or Other
3. For **mileage claims** — enter the distance in miles and the system calculates the amount automatically using the company mileage rate
4. For **other expenses** — enter the amount manually
5. Add a description and optionally upload a receipt photo or PDF
6. Submit — the expense goes to your manager for approval

**Approving Expenses (Admin/Manager):**

1. Go to **Expenses** then **All Expenses**
2. Filter by status — Pending, Approved, Rejected, or Paid
3. Review each expense with the staff name, type, amount, date, and description
4. Click Approve or Reject (with a reason)
5. Download the receipt if one was attached
6. Approved expenses feed into payroll automatically

**Expense statuses:** Pending (yellow), Approved (green), Rejected (red), Paid (blue)

**Weekly Mileage tab** shows an auto-calculated weekly mileage summary for each staff member.

---

## PART 4 — Invoicing & Payroll

### Generating Invoices

- **Council invoicing** — generated in the format required by local councils and health boards, including PO numbers and framework rates
- **Private client billing** — branded PDF invoices emailed directly to self-funding clients
- **Mixed funding** — for clients with a council allocation plus private top-up, both invoices are generated from the same logged visits

### Payroll

Payroll is calculated from actual worked shifts and includes:

- Basic hours at the staff member''s hourly rate or monthly salary equivalent
- Overtime calculations
- Bank holiday premium rates
- Sleep-in rates where applicable
- Approved mileage and expense claims
- PAYE tax deductions using current UK tax bands
- National Insurance contributions

> Only **Super Admins** can access payroll. Admins and standard staff cannot view or generate payslips.

---

## PART 5 — Clinical Features

### Clinical Assessments (7 Built In)

Access from any client''s profile under the **Clinical** tab:

1. **Waterlow** — Pressure ulcer risk assessment
2. **MUST** — Malnutrition Universal Screening Tool
3. **NEWS2** — National Early Warning Score for early deterioration detection
4. **Falls Risk** — Comprehensive falls risk assessment
5. **Abbey Pain Scale** — Pain assessment for clients who cannot self-report
6. **Barthel Index** — Functional ability and independence scoring
7. **SALT** — Swallowing assessment (Speech and Language Therapy)

Each assessment auto-calculates the risk score and stores the history for trend tracking.

### Clinical Observations

Track and trend the following over time with charts and alerts:

- Weight
- Blood pressure (systolic and diastolic)
- Temperature
- Pulse rate
- Oxygen saturation (SpO2)
- Blood sugar levels

### Wound Management

- Record wound location, size, and type
- IDDSI grading
- Set dressing schedules with automatic reminders
- Track wound progression — new, improving, stable, deteriorating, healed

### Falls Recording

- Record full details and contributing factors for each fall
- Automatic pattern analysis to identify trends and repeat fallers
- Links to falls risk assessments for each client

### Repositioning Chart

- Record repositioning times and body positions
- Automatic 4-hour gap detection with alerts if repositioning is overdue
- Compliance tracking for inspection evidence

### Continence Records

- Bristol Stool Chart integration
- Fluid intake and output tracking
- Pattern identification over time

### Clinical Dashboard

The admin Clinical Dashboard gives a real-time overview of all clinical data across all clients — assessments due, observations trending, wounds requiring attention, and repositioning compliance.

---

## PART 6 — Care Reports & Downloads

### Downloading Care Log Reports

Care log reports can be downloaded as professional PDF documents. These are ideal for sharing with social workers, GPs, safeguarding teams, and inspectors.

**How to download:**

1. Go to the **Service User** you need the report for
2. Open the **Care Logs** tab
3. Set the date range you want (default is the last 30 days)
4. Click **Download Care Logs PDF**
5. A professional PDF generates and downloads to your device

**What the PDF contains:**

- Cover sheet with client details, report period, and confidentiality notice
- One section per care visit with all recorded information
- Staff name, visit date and time, duration
- Mood, food intake, fluid intake observations
- Personal care tasks completed
- Medication details from that visit
- Any concerns or incidents flagged
- Body map markers if recorded
- Custom form field entries

**The PDF is formatted with:**

- Professional branded layout
- Colour-coded sections for easy reading
- GDPR confidentiality notice on every page
- Page numbers and client name on each page

> **For social workers:** Ask your care provider to download the care log PDF for the dates you need. The report gives a complete picture of all care delivered and can be filtered to any date range.

### Other Reports & Exports

From the **Reports** page you can also export:

- Shift data and attendance records
- Incident reports and follow-up status
- Payroll summaries (Super Admin only)
- Compliance reports for inspections
- All reports can be filtered by date range — last 7, 30, or 90 days

---

## PART 7 — Compliance & Inspection Readiness

### Virtual Care Inspector

The Virtual Inspector runs 50+ automated checks across 8 categories:

1. **Staff Compliance** — DBS checks, right to work, contracts, registrations
2. **Supervision** — 12-weekly supervision cycles per staff member
3. **Training** — Certificates, expiry dates, induction completion
4. **Service Users** — Care plans, reviews, assessments, emergency contacts
5. **Medication** — MAR gaps, administration records, PRN usage
6. **Care Delivery** — Shift coverage, care log completion rates
7. **Incidents** — Reporting, follow-up completion, resolution
8. **Governance** — RI visits, quality reviews, audits

**How to run the Virtual Inspector:**

1. Go to **Compliance** from the menu
2. Click **Virtual Inspector**
3. Review the scored report with findings grouped by category
4. Each finding shows what the issue is, which staff member or client is affected, the severity level (Critical, High, Medium, or Warning), and the specific regulation reference
5. Fix issues directly in the app by clicking through to the relevant page
6. Run regularly to track improvement over time

### CIW Pre-Populated Forms (Wales)

CareCallAI includes pre-populated forms for all key CIW requirements:

- **Regulation 73** — Responsible Individual Visits (every 3 months)
- **Regulation 80** — Quality of Care Review (every 6 months)
- **Regulation 68** — Fit and Proper Person / Registered Manager (annual)
- **Regulation 72** — Manager Absence Cover (28+ days absence)
- **Regulation 60** — Notifications to CIW (event-driven — safeguarding, serious injury, death)

Each form includes built-in guidance explaining what is required and how to complete it correctly.

### CQC Five Key Lines of Enquiry (England)

CareCallAI maps to all five CQC KLOEs:

- **Safe** — Incident reporting, MAR audit trail, staff DBS and training, risk assessments
- **Effective** — Person-centred care plans, outcome-focused care logs, staff training records
- **Caring** — Detailed care logs, family communication, mood and wellbeing tracking
- **Responsive** — Real-time schedule management, incident follow-up, care plan amendments
- **Well-led** — Management dashboard, compliance reports, supervision tracking, quality monitoring

---

## PART 8 — AI Assistant

### What It Can Do

- **Draft care plans** from assessment data — saves hours of writing
- **Generate risk assessments** covering mobility, medication, environment, and falls
- **Write professional letters** to GPs, social workers, and families
- **Summarise care logs and incidents** into management reports

### How to Use

1. Go to **AI Assistant** from the menu or access it from a client''s profile
2. Describe what you need — for example "Write a care plan for a client with diabetes and limited mobility"
3. AI generates a comprehensive first draft in seconds
4. Review the draft, edit as needed, and save
5. The final document is yours — AI assists but does not replace your professional judgement

> **Privacy:** Client data is never used to train AI models. Data is processed in real time only and is not stored or retained by the AI.

---

## PART 9 — Documents, Training & Notifications

### Documents

- Access all organisational policies and procedures
- Browse by category — policies, training materials, forms, templates
- Upload and store certificates, contracts, and payslips
- Mandatory reading with acknowledgement tracking — staff must confirm they have read key documents
- Version control on all policy documents

### Training

- View assigned courses and track completion progress
- Complete online assessments and quizzes
- Download completion certificates
- Automatic expiry tracking for refresher training
- Separate tracking for mandatory vs specialist training

### Notifications & Alerts

- **Urgent alerts** (red) — require immediate attention
- **Weather warnings** — safety updates for carers on the road
- **Announcements** — team-wide messages from management
- **Shift reminders** — upcoming shift notifications
- **Leave updates** — approval or rejection notices
- Customise which notifications you receive and set quiet hours

Push notifications on mobile take you directly to the relevant page in the app.

---

## Need Help?

- Post a question in the **Help & Support** category on this forum
- [Book a free 1-to-1 Teams session](/forum/help-and-support/book-teams-meeting) — you choose what we cover
- **Email:** hello@carecallai.co.uk
- **WhatsApp:** +44 7762 533406

This documentation is maintained by the CareCallAI team and updated regularly.' WHERE slug = 'carecallai-complete-user-guide';
