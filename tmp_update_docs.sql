UPDATE forum_threads
SET content = '# CareCallAI Complete Setup Guide & User Documentation

Welcome to the official CareCallAI documentation. This guide covers everything from initial setup to advanced features, in the order you need to complete them.

---

## PART 1: INITIAL SETUP

### Step 1 — Create Your Organisation

After signing up, you will be prompted to create your organisation. Enter your:
- Company name and registration number
- CIW or CQC registration number
- Office address and contact details
- Your regulatory body (CIW for Wales, CQC for England)

### Step 2 — Set Up Service Areas

Go to **Settings** and create your service areas (e.g. Denbigh, Llangollen). Each area has its own rota, shift types, and staff assignments. This allows you to manage multiple geographic locations from one account.

### Step 3 — Add Staff Members

Go to **Staff** and add each team member with:
- Full name, email, phone number, address
- Emergency contacts and next of kin
- Role (Carer, Senior Carer, Manager, Admin)
- DBS certificate number and date
- Right to work documentation
- Start date and contracted hours
- Assigned service area(s)
- Profile photo

Staff will receive login credentials by email.

### Step 4 — Set Up Training Requirements

In **Staff** > **Training**, configure:
- Mandatory training courses (manual handling, safeguarding, first aid, medication, infection control)
- Completion dates for each staff member
- Renewal intervals (system auto-calculates expiry dates)
- The system sends alerts at 30 days, 7 days, and on expiry

### Step 5 — Add Service Users (Clients)

Go to **Service Users** and create profiles for each client:
- Personal details (name, DOB, address, phone)
- Emergency contacts and next of kin
- GP details and medical history
- Allergies and dietary requirements
- Communication preferences
- Key safe code and access instructions
- Funding type (council-funded, private, or mixed)

### Step 6 — Create Care Plans

For each client, create a care plan covering:
- Personal care needs
- Medication requirements
- Mobility and equipment
- Nutrition and hydration
- Communication and social needs
- Risk assessments

**Tip:** Use the **AI Assistant** to draft care plans from assessment data — it generates comprehensive first drafts in seconds that you then review and edit.

### Step 7 — Set Up Medications (eMAR)

For each client, go to their profile > **MAR Chart** and add all prescribed medications:
- Medication name and dose
- Frequency and times (Morning, Afternoon, Evening, Night, As Needed/PRN)
- Route of administration
- Pill pouch indicator if applicable
- Start and end dates
- Special instructions

### Step 8 — Configure Your Rota

Go to **Rota** and set up your schedule:
1. Create **shift types** for your area (e.g. Morning 07:00-14:00, Afternoon 14:00-22:00, Night 22:00-07:00)
2. Create **base templates** — design your ideal week with all shifts
3. **Deploy templates** across date ranges with one click
4. Create **shift patterns** for individual staff (e.g. 2 weeks on, 1 week off)
5. Assign staff to shifts

### Step 9 — Set Up Invoicing

Go to **Invoicing** and configure:
- Rate cards (hourly rates per client, call type, and time of day)
- Council contract details (PO numbers, framework rates, contract hours)
- Private client billing settings
- Invoice frequency (weekly, fortnightly, monthly)
- Accounting software integration (QuickBooks, Sage, or Xero)

### Step 10 — Install the Mobile App

Staff download the app from:
- **iOS:** App Store (requires iOS 14+)
- **Android:** Google Play (requires Android 8+)

Log in with the same credentials. The app shows the daily rota, allows care logging, medication recording, GPS check-in, and incident reporting.

---

## PART 2: DAILY OPERATIONS

### Care Visit Workflow

**For each client visit:**
1. **Arrive** at the client home
2. **Check In** — tap the button or scan the QR code at the client''s home
3. The system verifies your GPS location is within range and records your arrival time
4. **Deliver care** as per the care plan
5. **Record medications** — open the MAR chart and mark each medication as Given (G), Refused (R), Destroyed (D), Not Available, Hospital, or Self-Administered
6. **Complete care log** — record mood, food intake, fluid intake, personal care provided, and notes. Attach photos if needed.
7. **Check Out** — tap when leaving. Duration and mileage are calculated automatically.
8. The manager''s live tracking map updates in real time throughout.

### Care Logging

**What to record:**
- Client''s mood and emotional state
- Food intake (what they ate, how much)
- Fluid intake (what they drank, how much)
- Personal care tasks completed
- Any observations or concerns
- Photos or evidence (optional)

Care logs are timestamped, attributed to the carer, and cannot be deleted — creating a complete audit trail.

### Medication Administration (eMAR)

**The Six Rights:**
- Right patient, Right drug, Right dose, Right route, Right time, Right documentation

**Status options:**
- **Given (G)** — medication administered as prescribed
- **Refused (R)** — client declined medication
- **Destroyed (D)** — medication destroyed (e.g. expired)
- **Not Available** — medication not in stock
- **Hospital** — client in hospital
- **Self-Administered** — client self-administers

Your initials are recorded automatically. PRN (As Needed) medications are tracked separately.

### Incident Reporting

**When to report:** Falls or injuries, medication errors, safeguarding concerns, near misses, equipment failures, complaints.

**How to report:**
1. Go to **Incidents** from the menu
2. Tap **Report Incident**
3. Record: incident type, date and time, location, full description, immediate actions taken, any witnesses
4. Submit — your manager is notified immediately
5. The incident is timestamped and immutable

### Chat & Messaging

- Send direct messages to colleagues
- Create group chats for teams
- Share photos, files, and voice notes
- Use reactions and reply threading
- Keep all messages professional and work-related

---

## PART 3: MANAGEMENT FEATURES

### Rota Management

**Views:** Day, Week, and Month
**Actions:**
- Create and assign shifts
- Deploy base templates across date ranges
- Set up recurring shift patterns per staff member
- Add one-off calls for impromptu visits
- Track Not at Home (amber) vs Missed (red) visits
- View live staff tracking map

### Staff Supervision

CareCallAI tracks 12-weekly staff supervisions as required by:
- **RISCA Reg 36** (CIW / Wales)
- **CQC Reg 18** (England)

The system:
- Calculates when each staff member''s next supervision is due
- Sends alerts when supervisions are approaching or overdue
- Provides supervision form templates
- Stores historical records
- The Virtual Inspector flags missing or overdue supervisions

### Leave Management

Staff submit leave requests through the app. Managers approve or decline. Approved leave automatically updates the rota.

**Leave types:** Annual leave, sick leave, compassionate leave, unpaid leave, training leave

### Expenses & Mileage

- Mileage is logged automatically from GPS check-in locations
- Staff can submit additional expenses (parking, equipment)
- Managers review and approve claims
- Approved expenses feed into payroll

### Invoicing & Payroll

- **Council invoicing** — generated in the format required by local councils and health boards, including PO numbers and framework rates
- **Private client billing** — branded PDF invoices emailed directly to self-funding clients
- **Payroll** — calculated from actual worked shifts including overtime, bank holidays, sleep-in rates, and mileage
- **Accounting integration** — sync to QuickBooks, Sage, or Xero automatically
- **Mixed funding** — for clients with council allocation plus private top-up, both invoices generated from the same logged visits

---

## PART 4: CLINICAL FEATURES

### Clinical Assessments (7 Built In)

1. **Waterlow** — Pressure ulcer risk assessment
2. **MUST** — Malnutrition Universal Screening Tool
3. **NEWS2** — National Early Warning Score (early deterioration detection)
4. **Falls Risk** — Comprehensive falls risk assessment
5. **Abbey Pain Scale** — Pain assessment for clients who cannot self-report
6. **Barthel Index** — Functional ability and independence scoring
7. **SALT** — Swallowing assessment (Speech and Language Therapy)

### Clinical Observations

Track and trend the following over time:
- Weight
- Blood pressure
- Temperature
- Pulse rate
- Oxygen saturation (SpO2)
- Blood sugar levels

### Wound Management

- Record wound location, size, and type
- IDDSI grading
- Dressing schedules with reminders
- Status progression tracking (new > improving > healed)

### Falls Recording

- Record contributing factors for each fall
- Pattern analysis to identify trends
- Link to falls risk assessments

### Repositioning Chart

- Record repositioning times and positions
- 4-hour gap detection with alerts
- Compliance tracking

### Continence Records

- Bristol Stool Chart integration
- Fluid intake and output tracking
- Pattern identification

### Clinical Dashboard

Real-time overview of all clinical data across all clients — assessments due, observations trending, wounds requiring attention.

---

## PART 5: COMPLIANCE & INSPECTION READINESS

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

**How to run:**
1. Go to **Compliance** from the menu
2. Click **Virtual Inspector**
3. Review scored report with findings grouped by category
4. Each finding shows: what the issue is, which staff member or client is affected, severity level (Critical, High, Medium, Warning), and the specific regulation reference
5. Fix issues directly in the app
6. Run regularly to track improvement

### CIW Pre-Populated Forms (Wales)

- **Reg 73** — Responsible Individual Visits (every 3 months)
- **Reg 80** — Quality of Care Review (every 6 months)
- **Reg 68** — Fit and Proper Person / Manager (annual)
- **Reg 72** — Manager Absence Cover (28+ days absence)
- **Reg 60** — Notifications to CIW (event-driven — safeguarding, serious injury, death, etc.)

Each form includes built-in guidance explaining what is required and how to complete it.

### CQC Five Key Lines of Enquiry (England)

CareCallAI maps to all five KLOEs:
- **Safe** — Incident reporting, MAR audit trail, staff DBS and training, risk assessments
- **Effective** — Person-centred care plans, outcome-focused care logs, staff training records
- **Caring** — Detailed care logs, family communication, mood and wellbeing tracking
- **Responsive** — Real-time schedule management, incident follow-up, care plan amendments
- **Well-led** — Management dashboard, compliance reports, supervision tracking, quality monitoring

---

## PART 6: AI ASSISTANT

### What It Can Do

- **Draft care plans** from assessment data (saves hours of writing)
- **Generate risk assessments** covering mobility, medication, environment, falls
- **Write professional communications** to GPs, social workers, and families
- **Summarise care logs and incidents** into management reports

### How to Use

1. Go to **AI Assistant** from the menu (or access from a client profile)
2. Describe what you need (e.g. "Write a care plan for a client with diabetes and limited mobility")
3. AI generates a comprehensive first draft in seconds
4. Review, edit as needed, and save
5. The final document is yours — AI assists, it does not replace professional judgement

**Privacy:** Client data is never used to train AI models. Data is processed in real time only and not retained.

---

## PART 7: FAMILY PORTAL

Families and next of kin can:
- View their relative''s care plan
- Read care logs and daily observations
- See a photo gallery of activities
- Communicate directly with the care team
- Request updates or raise concerns
- Provide feedback and satisfaction surveys

---

## PART 8: DOCUMENTS, TRAINING & NOTIFICATIONS

### Documents

- Access all organisational policies and procedures
- Browse by category (policies, training materials, forms)
- Upload and store certificates, contracts, payslips
- Mandatory reading with acknowledgement tracking
- Version control on all policy documents

### Training

- View assigned courses and track progress
- Complete assessments and quizzes
- Download completion certificates
- Automatic expiry tracking for refresher training
- Distinguish mandatory vs specialist training

### Notifications & Alerts

- **Urgent alerts** (red) — require immediate attention
- **Weather warnings** — important safety updates
- **Announcements** — team-wide messages from management
- **Shift reminders** — upcoming shift notifications
- **Leave updates** — approval or rejection notices
- Customise which notifications you receive and set quiet hours

Push notifications on mobile take you directly to the relevant page.

---

## Need Help?

- Post a question in the **Help & Support** category on this forum
- Book a free Teams demo: [Click here to open the Booking Calendar](https://carecallai.co.uk/forum/booking)
- Email: hello@carecallai.co.uk
- WhatsApp: +44 7762 533406

This documentation is maintained by the CareCallAI team and updated regularly.'
WHERE slug = 'carecallai-complete-user-guide';
