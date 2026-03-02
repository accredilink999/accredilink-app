'use client';

import { useState } from 'react';

const sections = {
  en: [
    {
      title: 'Getting Started',
      content: [
        { heading: 'Signing Up', text: 'Visit the CareCall AI app and click "Sign Up". Enter your email address and create a password. You will receive a verification email — click the link to activate your account.' },
        { heading: 'Setting Up Your Organisation', text: 'After your first login, you will be asked to create your organisation. Enter your care company name and a URL-friendly slug will be generated automatically. This creates your isolated workspace where all your data is stored securely.' },
        { heading: 'Adding Staff', text: 'Navigate to the Staff section to add team members. Enter their name, email, role, and area. Staff can then be assigned to shifts, training courses, and supervision schedules.' },
        { heading: 'Mobile App', text: 'CareCall AI is available as a mobile app for iOS and Android. Staff can download it from the App Store or Google Play. The mobile app allows care logging, rota viewing, and communication on the go.' },
      ],
    },
    {
      title: 'Managing Staff',
      content: [
        { heading: 'Staff Profiles', text: 'Each staff member has a profile with personal details, contract information, training records, and HR documents. Keep profiles up to date for compliance purposes.' },
        { heading: 'Rota Management', text: 'The Rota page shows a weekly view of all shifts across your areas. You can create shift types, build base templates, and deploy patterns to fill rotas quickly. Blank shifts are generated automatically.' },
        { heading: 'Shift Patterns', text: 'Create repeating shift patterns (e.g., Week 1 / Week 2 rotations) and deploy them across date ranges. The system matches blank shifts and assigns staff automatically.' },
        { heading: 'Leave & Sickness', text: 'Staff can request leave through the app. Managers review and approve requests. Sickness records are tracked separately for Bradford Factor monitoring.' },
        { heading: 'Supervision', text: 'RISCA Regulation 36 requires staff supervision every 12 weeks. CareCall AI tracks supervision dates and alerts you when supervisions are due. Record supervision notes directly in the system.' },
      ],
    },
    {
      title: 'Service Users',
      content: [
        { heading: 'Adding Service Users', text: 'Navigate to Service Users and click "Add New". Enter personal details, emergency contact, medical information, and care requirements. Each service user gets a comprehensive digital care plan.' },
        { heading: 'Care Plans', text: 'Care plans include: personal information, emergency contacts, medical history, what matters to the person, communication needs, risk assessments, and person-centred call plans. All sections are available in both English and Welsh.' },
        { heading: 'Bilingual Support', text: 'Toggle between English and Welsh using the language switcher on the care plan page. Section headings and labels switch instantly. Use the "Translate to Cymraeg" button to AI-translate all user-entered content.' },
        { heading: 'PDF Export', text: 'Download care plans as professional PDF documents in either English or Welsh. These can be printed for care files or shared with families and inspectors.' },
      ],
    },
    {
      title: 'Care Logging',
      content: [
        { heading: 'Daily Care Logs', text: 'Staff record care activities during each visit. The care log form is customisable per service user. Standard fields include: activities completed, mood, food/fluid intake, medication, and notes.' },
        { heading: 'Body Map', text: 'Use the interactive body map to record injuries, skin conditions, or areas of concern. Mark locations on front and back views with descriptions.' },
        { heading: 'Healthcare Logs', text: 'For clinical observations, use healthcare logs to record blood pressure, temperature, blood sugar, weight, and other vital signs.' },
        { heading: 'eMAR', text: 'The electronic Medication Administration Record tracks every medication dose. Staff confirm administration at the point of care. Missed doses, refusals, and PRN medications are all recorded.' },
      ],
    },
    {
      title: 'Training',
      content: [
        { heading: 'Training Matrix', text: 'The training matrix shows all staff against required training courses. Track who has completed what, when certificates expire, and which training is overdue.' },
        { heading: 'AI Course Builder', text: 'Create training courses using AI. Provide a topic and the AI generates a full course with modules, lessons, and assessment questions. Courses can include links to official YouTube training videos.' },
        { heading: 'Certificates', text: 'Upload training certificates for each staff member. The system tracks expiry dates and alerts you before certificates lapse.' },
      ],
    },
    {
      title: 'Invoicing',
      content: [
        { heading: 'Creating Invoices', text: 'Navigate to Invoicing to create invoices for clients. Select a client, date range, and the system calculates hours from shift data. Add custom line items, apply rates, and generate professional PDF invoices.' },
        { heading: 'Recurring Invoices', text: 'Set up recurring invoices for regular clients. Choose weekly, fortnightly, or monthly frequency. The system auto-generates invoices on schedule.' },
        { heading: 'Payments', text: 'Record payments against invoices. Track outstanding balances and send payment reminders.' },
        { heading: 'Payroll', text: 'Calculate staff payroll from shift data. The system totals hours, applies rates, and accounts for overtime, bank holidays, and deductions.' },
      ],
    },
    {
      title: 'Compliance',
      content: [
        { heading: 'CIW Dashboard', text: 'The Compliance page provides forms for each CIW/RISCA regulation. Each form includes built-in guidance explaining what the regulation requires and what evidence inspectors look for.' },
        { heading: 'Regulation Filing', text: 'Complete regulation forms with your evidence and notes. The system stores a history of submissions so you can demonstrate continuous compliance improvement.' },
        { heading: 'Safeguarding', text: 'Report safeguarding incidents through structured forms. Include body maps, witness information, actions taken, and follow-up plans. All reports are timestamped and auditable.' },
        { heading: 'Audit Trail', text: 'CareCall AI maintains a full audit trail of all actions. Every care log, medication administration, and staff change is recorded with timestamps and user attribution.' },
      ],
    },
  ],
  cy: [
    {
      title: 'Cychwyn Arni',
      content: [
        { heading: 'Cofrestru', text: 'Ewch i app CareCall AI a chliciwch "Cofrestru". Rhowch eich cyfeiriad e-bost a chreu cyfrinair. Byddwch yn derbyn e-bost dilysu — cliciwch y ddolen i actifadu eich cyfrif.' },
        { heading: 'Sefydlu Eich Sefydliad', text: 'Ar ôl eich mewngofnodiad cyntaf, gofynnir i chi greu eich sefydliad. Rhowch enw eich cwmni gofal a bydd slug URL-gyfeillgar yn cael ei greu yn awtomatig. Mae hyn yn creu eich gweithle ynysig lle mae eich holl ddata yn cael ei storio\'n ddiogel.' },
        { heading: 'Ychwanegu Staff', text: 'Ewch i\'r adran Staff i ychwanegu aelodau tîm. Rhowch eu henw, e-bost, rôl, ac ardal. Gellir wedyn neilltuo staff i sifftiau, cyrsiau hyfforddi, ac amserlenni goruchwylio.' },
        { heading: 'Ap Symudol', text: 'Mae CareCall AI ar gael fel ap symudol ar gyfer iOS ac Android. Gall staff ei lawrlwytho o\'r App Store neu Google Play. Mae\'r ap symudol yn caniatáu cofnodi gofal, gweld rotas, a chyfathrebu ar y ffordd.' },
      ],
    },
    {
      title: 'Rheoli Staff',
      content: [
        { heading: 'Proffiliau Staff', text: 'Mae gan bob aelod o staff broffil gyda manylion personol, gwybodaeth contract, cofnodion hyfforddiant, a dogfennau AD. Cadwch broffiliau\'n gyfredol at ddibenion cydymffurfiaeth.' },
        { heading: 'Rheoli Rota', text: 'Mae\'r dudalen Rota yn dangos golwg wythnosol o\'r holl sifftiau ar draws eich ardaloedd. Gallwch greu mathau o sifftiau, adeiladu templedi sylfaen, a defnyddio patrymau i lenwi rotas yn gyflym.' },
        { heading: 'Patrymau Sifft', text: 'Crëwch batrymau sifft ailadroddus (e.e., cylchdro Wythnos 1 / Wythnos 2) a\'u defnyddio ar draws ystodau dyddiad. Mae\'r system yn cyfateb sifftiau gwag ac yn neilltuo staff yn awtomatig.' },
        { heading: 'Gwyliau a Salwch', text: 'Gall staff ofyn am wyliau drwy\'r app. Mae rheolwyr yn adolygu ac yn cymeradwyo ceisiadau. Mae cofnodion salwch yn cael eu tracio ar wahân ar gyfer monitro Ffactor Bradford.' },
        { heading: 'Goruchwyliaeth', text: 'Mae Rheoliad 36 RISCA yn gofyn am oruchwyliaeth staff bob 12 wythnos. Mae CareCall AI yn tracio dyddiadau goruchwyliaeth ac yn eich rhybuddio pan fo goruchwyliaeth yn ddyledus.' },
      ],
    },
    {
      title: 'Defnyddwyr Gwasanaeth',
      content: [
        { heading: 'Ychwanegu Defnyddwyr Gwasanaeth', text: 'Ewch i Ddefnyddwyr Gwasanaeth a chliciwch "Ychwanegu Newydd". Rhowch fanylion personol, cyswllt argyfwng, gwybodaeth feddygol, a gofynion gofal.' },
        { heading: 'Cynlluniau Gofal', text: 'Mae cynlluniau gofal yn cynnwys: gwybodaeth bersonol, cysylltiadau argyfwng, hanes meddygol, beth sy\'n bwysig i\'r person, anghenion cyfathrebu, asesiadau risg, a chynlluniau galwad sy\'n canolbwyntio ar y person.' },
        { heading: 'Cefnogaeth Ddwyieithog', text: 'Toglo rhwng Cymraeg a Saesneg gan ddefnyddio\'r switsh iaith ar dudalen y cynllun gofal. Mae penawdau ac labeli adrannau yn newid ar unwaith.' },
        { heading: 'Allforio PDF', text: 'Lawrlwythwch gynlluniau gofal fel dogfennau PDF proffesiynol yn Gymraeg neu Saesneg. Gellir eu hargraffu ar gyfer ffeiliau gofal neu eu rhannu gyda theuluoedd ac arolygwyr.' },
      ],
    },
    {
      title: 'Cofnodi Gofal',
      content: [
        { heading: 'Cofnodion Gofal Dyddiol', text: 'Mae staff yn cofnodi gweithgareddau gofal yn ystod pob ymweliad. Mae\'r ffurflen gofnodi gofal yn addasadwy fesul defnyddiwr gwasanaeth.' },
        { heading: 'Map Corff', text: 'Defnyddiwch y map corff rhyngweithiol i gofnodi anafiadau, cyflyrau croen, neu feysydd o bryder. Marciwch leoliadau ar olygfeydd blaen a chefn gyda disgrifiadau.' },
        { heading: 'Cofnodion Gofal Iechyd', text: 'Ar gyfer arsylwadau clinigol, defnyddiwch gofnodion gofal iechyd i gofnodi pwysedd gwaed, tymheredd, siwgr gwaed, pwysau, ac arwyddion hanfodol eraill.' },
        { heading: 'eMAR', text: 'Mae\'r Cofnod Gweinyddu Meddyginiaeth Electronig yn tracio pob dos meddyginiaeth. Mae staff yn cadarnhau gweinyddu ar bwynt gofal.' },
      ],
    },
    {
      title: 'Hyfforddiant',
      content: [
        { heading: 'Matrics Hyfforddiant', text: 'Mae\'r matrics hyfforddiant yn dangos yr holl staff yn erbyn cyrsiau hyfforddi gofynnol. Traciwch bwy sydd wedi cwblhau beth, pryd mae tystysgrifau\'n dod i ben, a pha hyfforddiant sydd yn hwyr.' },
        { heading: 'Adeiladwr Cyrsiau AI', text: 'Crëwch gyrsiau hyfforddi gan ddefnyddio AI. Darparwch bwnc ac mae\'r AI yn cynhyrchu cwrs llawn gyda modiwlau, gwersi, a chwestiynau asesu.' },
        { heading: 'Tystysgrifau', text: 'Uwchlwythwch dystysgrifau hyfforddi ar gyfer pob aelod o staff. Mae\'r system yn tracio dyddiadau dod i ben ac yn eich rhybuddio cyn i dystysgrifau ddod i ben.' },
      ],
    },
    {
      title: 'Anfonebu',
      content: [
        { heading: 'Creu Anfonebau', text: 'Ewch i Anfonebu i greu anfonebau ar gyfer cleientiaid. Dewiswch gleient, ystod dyddiad, ac mae\'r system yn cyfrifo oriau o ddata sifft.' },
        { heading: 'Anfonebau Cylchol', text: 'Sefydlwch anfonebau cylchol ar gyfer cleientiaid rheolaidd. Dewiswch amlder wythnosol, pythefnosol, neu fisol.' },
        { heading: 'Taliadau', text: 'Cofnodwch daliadau yn erbyn anfonebau. Traciwch falansau sy\'n weddill ac anfonwch nodiadau atgoffa taliad.' },
        { heading: 'Cyflogres', text: 'Cyfrifwch gyflogres staff o ddata sifft. Mae\'r system yn cyfrif oriau, yn cymhwyso cyfraddau, ac yn cyfrif am oramser, gwyliau banc, a didyniadau.' },
      ],
    },
    {
      title: 'Cydymffurfiaeth',
      content: [
        { heading: 'Dangosfwrdd AGC', text: 'Mae\'r dudalen Cydymffurfiaeth yn darparu ffurflenni ar gyfer pob rheoliad AGC/RISCA. Mae pob ffurflen yn cynnwys arweiniad adeiledig yn egluro beth mae\'r rheoliad yn ei ofyn.' },
        { heading: 'Ffeilio Rheoliadau', text: 'Cwblhewch ffurflenni rheoliad gyda\'ch tystiolaeth a\'ch nodiadau. Mae\'r system yn storio hanes cyflwyniadau fel y gallwch ddangos gwelliant cydymffurfiaeth parhaus.' },
        { heading: 'Diogelu', text: 'Adroddwch ddigwyddiadau diogelu drwy ffurflenni strwythuredig. Cynhwyswch fapiau corff, gwybodaeth tystion, camau a gymerwyd, a chynlluniau dilyniant.' },
        { heading: 'Llwybr Archwilio', text: 'Mae CareCall AI yn cynnal llwybr archwilio llawn o\'r holl weithredoedd. Mae pob cofnod gofal, gweinyddu meddyginiaeth, a newid staff yn cael ei gofnodi gyda stampiau amser.' },
      ],
    },
  ],
};

export default function HandbookPage() {
  const [lang, setLang] = useState('en');
  const t = sections[lang];

  return (
    <div className="bg-white">
      {/* Language toggle bar */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {lang === 'en' ? 'Client Handbook' : 'Llawlyfr Cleientiaid'} — CareCall AI
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {lang === 'en' ? 'Print / PDF' : 'Argraffu / PDF'}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'cy' : 'en')}
              className="px-3 py-1 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              {lang === 'en' ? 'Cymraeg' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">
            {lang === 'en' ? 'CareCall AI — Client Handbook' : 'CareCall AI — Llawlyfr Cleientiaid'}
          </h1>
          <p className="mt-3 text-teal-100 text-lg">
            {lang === 'en'
              ? 'A step-by-step guide for care home managers and domiciliary care providers.'
              : 'Canllaw cam wrth gam ar gyfer rheolwyr cartrefi gofal a darparwyr gofal cartref.'}
          </p>
        </div>
      </section>

      {/* Table of contents */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {lang === 'en' ? 'Contents' : 'Cynnwys'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-1">
            {t.map((section, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="text-sm text-teal-700 hover:text-teal-900 hover:underline py-0.5"
              >
                {i + 1}. {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {t.map((section, i) => (
          <section key={i} id={`section-${i}`} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
            </div>
            <div className="space-y-6 pl-11">
              {section.content.map((item, j) => (
                <div key={j}>
                  <h3 className="font-semibold text-slate-800 mb-1">{item.heading}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'en' ? 'Need help getting started?' : 'Angen help i gychwyn arni?'}
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            {lang === 'en'
              ? 'Contact our support team or book a personalised demo.'
              : 'Cysylltwch â\'n tîm cymorth neu trefnwch demo personol.'}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://carecallai-website.vercel.app/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm"
            >
              {lang === 'en' ? 'Start Free Trial' : 'Dechrau Treial Am Ddim'}
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white transition-colors text-sm"
            >
              {lang === 'en' ? 'Contact Support' : 'Cysylltu â Chymorth'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
