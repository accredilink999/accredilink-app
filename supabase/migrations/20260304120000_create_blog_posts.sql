-- Blog posts table for CareCallAI website
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  read_time TEXT NOT NULL DEFAULT '5 min read',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  published BOOLEAN NOT NULL DEFAULT false,
  seo_keywords TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date ON blog_posts(published, date DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read for published posts (anon key)
CREATE POLICY "Public read published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Service role has full access (bypasses RLS anyway, but explicit)
CREATE POLICY "Service role full access"
  ON blog_posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON blog_posts TO anon;
GRANT ALL ON blog_posts TO service_role;

-- Seed the existing 4 blog posts
INSERT INTO blog_posts (slug, title, description, content, category, read_time, date, published) VALUES
(
  '5-signs-your-care-agency-needs-better-software',
  '5 Signs Your Care Agency Needs Better Software',
  'Still using paper rotas and spreadsheets? Here are five signs it''s time to upgrade to proper care management software.',
  E'Many domiciliary care agencies start with paper-based systems — handwritten rotas, paper MAR charts, filing cabinets full of care plans. It works when you have a handful of staff and clients. But as you grow, the cracks start to show.\n\nHere are five signs it''s time to invest in care management software:\n\n## 1. You''re spending more time on admin than care\n\nIf your coordinators are spending hours each week building rotas in spreadsheets, chasing paper timesheets and manually calculating invoices, that''s time taken away from what matters — supporting your care team and clients.\n\nModern care software automates scheduling, time tracking and invoicing, freeing up hours every week.\n\n## 2. Information is scattered across multiple systems\n\nClient details in one spreadsheet, staff training in another, MAR charts on paper, care plans in Word documents. When an inspector asks for a client''s full record, how long does it take to pull it together?\n\nWith integrated care software, everything lives in one place — searchable, filterable and accessible in seconds.\n\n## 3. Medication errors are happening\n\nPaper MAR charts are a leading source of medication errors. Missed entries, illegible handwriting, unsigned doses — these create real risks for your clients and real problems at inspection.\n\nElectronic MAR charts eliminate these issues with clear digital records, real-time alerts and complete audit trails.\n\n## 4. You can''t see what''s happening in real time\n\nWith paper-based systems, you only find out about missed calls, incidents or concerns when the paperwork comes back to the office — sometimes days later.\n\nCare software gives managers real-time visibility. You can see which calls are in progress, which have been completed, and act immediately when something needs attention.\n\n## 5. CIW or CQC inspections stress you out\n\nIf preparing for an inspection means days of gathering files, cross-referencing records and hoping nothing''s missing, you need better systems.\n\nGood care software makes you inspection-ready all the time. Pull up any record in seconds, generate compliance reports on demand, and demonstrate your audit trail with confidence.\n\n## The bottom line\n\nIf any of these sound familiar, it''s worth exploring what modern care management software can do for your agency. The right tool pays for itself in time saved, errors prevented and compliance confidence.\n\nCareCallAI is built specifically for UK domiciliary care agencies — with everything from scheduling to MAR charts to CIW/CQC compliance. Start your free trial to see the difference.',
  'Getting Started',
  '4 min read',
  '2026-02-24',
  true
),
(
  'ciw-vs-cqc-whats-the-difference',
  'CIW vs CQC: What''s the Difference?',
  'A clear guide to the differences between Care Inspectorate Wales (CIW) and the Care Quality Commission (CQC) for domiciliary care agencies.',
  E'If you run a domiciliary care agency in the UK, you''re regulated by either CIW (Care Inspectorate Wales) or CQC (Care Quality Commission) — depending on where you operate. Here''s what you need to know about both.\n\n## CIW — Care Inspectorate Wales\n\nCIW regulates and inspects care services in Wales under the Regulation and Inspection of Social Care (Wales) Act 2016.\n\n**Key requirements for domiciliary care:**\n- Statement of purpose and service user guide\n- Personal plans (care plans) for every individual\n- Accurate medication records\n- Staff training and qualification records\n- DBS checks for all staff\n- Incident and safeguarding reporting\n- Quality of care reviews\n\n**Inspection approach:** CIW inspections can be announced or unannounced. Inspectors review documentation, interview staff and clients, and observe care delivery.\n\n## CQC — Care Quality Commission\n\nCQC regulates health and social care services in England under the Health and Social Care Act 2008.\n\n**Key areas (Key Lines of Enquiry):**\n- **Safe** — Are people protected from abuse and avoidable harm?\n- **Effective** — Does care achieve good outcomes?\n- **Caring** — Are people treated with kindness and respect?\n- **Responsive** — Is care organised around individual needs?\n- **Well-led** — Is leadership effective and the culture open?\n\n**Rating system:** CQC rates services as Outstanding, Good, Requires Improvement, or Inadequate.\n\n## Key Differences\n\nCIW covers Wales under RISCA 2016 with no formal rating system and themed inspections. CQC covers England under HSCA 2008 with a 4-level rating system and KLoE-based inspections. CIW supports Welsh and English languages.\n\n## What This Means for Your Software\n\nWhether you''re regulated by CIW or CQC, you need the same fundamental capabilities:\n- Accurate, timestamped care records\n- Electronic medication management\n- Incident reporting with audit trails\n- Staff training and DBS tracking\n- Care plan management with review dates\n\nCareCallAI covers both regulators, with specific features tailored to CIW (Wales) and CQC (England) requirements.',
  'Compliance',
  '5 min read',
  '2026-02-24',
  true
),
(
  'why-paper-rotas-are-costing-you-money',
  'Why Paper Rotas Are Costing You Money',
  'Paper rotas waste time, cause errors and make compliance harder. Here''s how much they''re really costing your care agency.',
  E'If you''re still building your care rota on paper or in a spreadsheet, you''re spending more than you think. Here''s the real cost of manual scheduling.\n\n## Time costs\n\nA typical care coordinator spends 4-8 hours per week building and adjusting the rota manually. That''s 200-400 hours per year — the equivalent of 5-10 full working weeks. At an average coordinator salary, that''s £3,000-6,000 per year spent on a task that software handles in minutes.\n\n## Error costs\n\nManual rotas are prone to double-bookings, missed calls and scheduling conflicts. Each missed call risks:\n- Client harm or discomfort\n- Complaint or safeguarding referral\n- CIW/CQC non-compliance finding\n- Loss of client contract\n\nThe cost of a single missed call that results in a complaint can far exceed the annual cost of scheduling software.\n\n## Staff frustration\n\nCarers who get their rota late, find it changed without notice, or discover clashes are more likely to leave. Staff turnover in care is already high — poor scheduling makes it worse. Recruiting and training a replacement carer costs £1,000-2,000.\n\n## Compliance gaps\n\nPaper rotas don''t create audit trails. When CIW or CQC ask who was scheduled where and when, you''re relying on memory and incomplete records. Digital scheduling creates an automatic, immutable record of every shift and call.\n\n## The alternative\n\nModern care scheduling software like CareCallAI lets you:\n- Build a week''s rota in minutes using shift patterns and templates\n- See coverage gaps instantly on day, week and month views\n- Push changes to carers'' phones in real time\n- Create a permanent audit trail of all scheduling decisions\n\nAt £99/month, it pays for itself in the first week of coordinator time saved.',
  'Scheduling',
  '4 min read',
  '2026-02-24',
  true
),
(
  'electronic-mar-charts-explained',
  'Electronic MAR Charts Explained',
  'Everything you need to know about electronic MAR charts for domiciliary care — what they are, why they matter, and how to choose the right system.',
  E'Electronic MAR (Medication Administration Record) charts are replacing paper-based medication records across UK domiciliary care. Here''s everything you need to know.\n\n## What is a MAR chart?\n\nA MAR chart records every medication administered to a service user — what was given, when, by whom, and at what dose. It''s a legal record and a critical part of CIW and CQC compliance.\n\n## Problems with paper MAR charts\n\nPaper MAR charts have been the standard for decades, but they come with significant risks:\n\n- **Illegible handwriting** — Carers signing under time pressure often produce entries that can''t be read\n- **Missing entries** — Blank spaces could mean the medication wasn''t given, or the carer forgot to sign\n- **No real-time visibility** — Managers only see the MAR chart when it comes back to the office\n- **Damage and loss** — Paper gets wet, torn, lost in transit\n- **No audit trail** — If someone amends an entry, there''s no record of the original\n\n## How electronic MAR charts work\n\nWith an electronic system like CareCallAI:\n\n1. Medications are set up with name, dose, frequency and time of day\n2. Carers open the MAR chart on their phone during a visit\n3. They record each medication as Given, Refused or Destroyed with their digital signature\n4. The record is instantly visible to managers and pharmacists\n5. The audit trail is automatic — every action timestamped and immutable\n\n## Key features to look for\n\nWhen choosing an electronic MAR chart system, look for:\n\n- **PRN support** — As-needed medications must be tracked separately\n- **Pill pouch tracking** — For pre-packaged medications\n- **Refused and destroyed recording** — Not just "given"\n- **Dose and timing visibility** — Carers need to see what to give and when\n- **Mobile-friendly interface** — Carers complete MAR charts on their phones\n- **Integration with care logs** — MAR chart should be accessible during care logging\n- **Audit trail** — Every entry timestamped and attributed\n\n## The compliance benefit\n\nCIW and CQC both require accurate medication records. Electronic MAR charts provide:\n- Complete, legible records for every medication round\n- Instant visibility of missed or refused medications\n- An immutable audit trail that inspectors can review\n- Reduced medication errors through clear prompts and alerts\n\nCareCallAI''s MAR chart includes all of these features and integrates directly with care logging — carers can open the MAR chart as a popup during a visit and return to their care log with a single tap.',
  'Medication',
  '6 min read',
  '2026-02-24',
  true
);
