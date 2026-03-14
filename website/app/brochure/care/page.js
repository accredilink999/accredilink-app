'use client';

import { useState, useRef } from 'react';

export default function CareBrochure() {
  const [generating, setGenerating] = useState(false);
  const brochureRef = useRef(null);

  async function downloadPDF() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const el = brochureRef.current;
      const pages = el.querySelectorAll('.brochure-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = 210;
      const pdfH = 297;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgW = pdfW;
        const imgH = (canvas.height * pdfW) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, Math.min(imgH, pdfH));
      }

      pdf.save('Accredilink-Care-Brochure.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try using Print > Save as PDF instead.');
    }
    setGenerating(false);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700">
            &larr; Back to website
          </a>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Print
            </button>
            <button
              onClick={downloadPDF}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-white bg-[#B91C1C] rounded-lg hover:bg-[#991B1B] disabled:opacity-50"
            >
              {generating ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Brochure Pages */}
      <div ref={brochureRef} className="max-w-[900px] mx-auto py-8 space-y-8 print:space-y-0 print:py-0 print:max-w-none">

        {/* PAGE 1 — Cover */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 40%, #1e3a1e 100%)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', opacity: 0.15 }}>
            <img src="/images/welsh-landscape.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '80px 60px', height: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <img src="/images/logo.png" alt="Accredilink" style={{ height: '60px', marginBottom: '20px' }} />
            </div>
            <div>
              <div style={{ width: '80px', height: '4px', background: '#B91C1C', marginBottom: '30px', borderRadius: '2px' }} />
              <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>
                Accredilink
              </h1>
              <h2 style={{ fontSize: '24px', fontWeight: 400, color: '#94a3b8', lineHeight: 1.4, marginBottom: '40px', fontFamily: 'system-ui, sans-serif' }}>
                Community Response Taskforce
              </h2>
              <p style={{ fontSize: '20px', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.6, maxWidth: '500px', fontFamily: 'system-ui, sans-serif' }}>
                Care Rooted in Community.<br />Delivered with Heart.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#B91C1C' }} />
                <span style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>Proudly Welsh</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#166534' }} />
                <span style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>CIW Registered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }} />
                <span style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>Family-Run</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2 — About Us */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always' }}>
          <div style={{ padding: '50px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#B91C1C', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>About Us</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '30px', fontFamily: 'system-ui, sans-serif' }}>
              A Welsh Care Provider<br />Built on Family Values
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, marginBottom: '16px', fontFamily: 'system-ui, sans-serif' }}>
                  Accredilink Community Response Taskforce is a proudly Welsh, family-orientated domiciliary care provider serving Denbighshire, Conwy, and communities right across North Wales.
                </p>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, marginBottom: '16px', fontFamily: 'system-ui, sans-serif' }}>
                  Founded by Michael and Elen Bohanna, the organisation was built from the ground up with a clear vision: to deliver genuine, community-focused care that keeps people safe and independent in their own homes.
                </p>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, fontFamily: 'system-ui, sans-serif' }}>
                  Many of the care team were born and raised in the very communities they serve. They understand the culture, the values, and the importance of a familiar face at the door.
                </p>
              </div>
              <div>
                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                  <img src="/images/about-team.jpg" alt="Our Team" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '16px', color: '#0f172a', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>
                    &ldquo;The best care comes from people who genuinely know and love their community.&rdquo;
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>— Michael Bohanna, Responsible Individual</p>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', fontFamily: 'system-ui, sans-serif' }}>Our Leadership</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fff7ed)', borderRadius: '12px', padding: '24px', border: '1px solid #fecaca' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', fontFamily: 'system-ui, sans-serif' }}>Michael Bohanna</h4>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#B91C1C', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>Responsible Individual &amp; Founder</p>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>
                  With a background in pre-hospital emergency care, Michael brings a hands-on approach to everything the organisation does. From recruiting staff to overseeing compliance, nothing happens at Accredilink without his involvement.
                </p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: '12px', padding: '24px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', fontFamily: 'system-ui, sans-serif' }}>Elen Bohanna</h4>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>Care Manager &amp; Head of Operational Care</p>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>
                  Elen is the driving force behind day-to-day care delivery. Unlike many in management, she continues to deliver direct care alongside the team, leading by example. Fluent in Welsh and English.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 3 — Services Part 1 */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always' }}>
          <div style={{ padding: '50px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#B91C1C', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>Our Services</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '30px', fontFamily: 'system-ui, sans-serif' }}>
              Comprehensive Care &amp;<br />Support Services
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[
                { title: 'Domiciliary Care', color: '#B91C1C', desc: 'Personal care, medication support, and daily living assistance in the comfort of your own home. Tailored care plans built around individual routines, preferences, and needs. From morning calls to bedtime support.' },
                { title: 'Dementia Care', color: '#7c3aed', desc: 'Specialist support for people living with dementia. The team follows established routines, reduces anxiety, and creates moments of genuine connection and joy. Person-centred approaches that adapt as needs change.' },
                { title: 'Palliative &amp; End of Life Care', color: '#166534', desc: 'Gentle, compassionate support for people with life-limiting conditions. Delivered in partnership with health professionals to keep individuals comfortable, dignified, and at home surrounded by the people they love.' },
                { title: 'Respite Care', color: '#0369a1', desc: 'Short-term care to give family carers a well-deserved break. Whether for a few hours, a weekend, or longer — clients are looked after by familiar, trusted care workers while their regular carer recharges.' },
              ].map((s, i) => (
                <div key={i} style={{ borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: s.color }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', fontFamily: 'system-ui, sans-serif' }} dangerouslySetInnerHTML={{ __html: s.title }} />
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '30px', borderRadius: '16px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              <img src="/images/domiciliary-care.jpg" alt="Domiciliary Care" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <img src="/images/palliative-care.jpg" alt="Palliative Care" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        {/* PAGE 4 — Services Part 2 */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always' }}>
          <div style={{ padding: '50px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#166534', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>More Services</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '30px', fontFamily: 'system-ui, sans-serif' }}>
              Specialist &amp; Emergency<br />Support Services
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[
                { title: 'Overnight Care', color: '#1e40af', desc: 'Waking or sleeping night care for people who need support through the small hours. Whether managing medication, assisting with personal care, or simply providing reassurance — someone is always there.' },
                { title: 'Sit-in Services', color: '#b45309', desc: 'Companionship and supervision for people who should not be left alone. A trusted care worker stays in the home, providing company, conversation, and peace of mind for the whole family.' },
                { title: 'Emergency Response', color: '#dc2626', desc: 'Rapid response to urgent care situations. Trained emergency care responders are available to attend when the unexpected happens, providing pre-hospital care and immediate support.' },
                { title: 'Social Care &amp; Companionship', color: '#059669', desc: 'Support to maintain social connections and combat loneliness. From accompanying someone to a community group or appointment, to simply sharing a cup of tea and a conversation at home.' },
              ].map((s, i) => (
                <div key={i} style={{ borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: s.color }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', fontFamily: 'system-ui, sans-serif' }} dangerouslySetInnerHTML={{ __html: s.title }} />
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '30px', borderRadius: '16px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              <img src="/images/sitin-services.jpg" alt="Sit-in Services" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <img src="/images/emergency-response.jpg" alt="Emergency Response" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        {/* PAGE 5 — Technology */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always' }}>
          <div style={{ padding: '50px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#0369a1', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>Technology</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>
              Powered by CareCallAI
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, marginBottom: '30px', maxWidth: '500px', fontFamily: 'system-ui, sans-serif' }}>
              A purpose-built digital care platform developed in-house to ensure the highest standards of care delivery, transparency, and compliance.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '30px' }}>
              {[
                { title: 'Real-Time Visit Logging', desc: 'Every care visit logged with GPS verification. Managers have full visibility of who is where and when.' },
                { title: 'Electronic MAR (eMAR)', desc: 'Digital medication tracking replaces paper charts. Missed doses flagged immediately with full audit trail.' },
                { title: 'Clinical Assessments', desc: 'Waterlow, MUST, NEWS2, Falls Risk, Abbey Pain, Barthel Index, and SALT — all completed digitally.' },
                { title: 'Family Portal', desc: 'Families access visit logs, medication records, and care notes in real time through a secure online portal.' },
                { title: 'Staff Supervision', desc: '12-weekly supervision tracking ensures RISCA Regulation 36 compliance. Every session documented and evidenced.' },
                { title: 'Mobile-First Design', desc: 'Care workers use the app on their phones during every visit. Works offline and syncs when signal returns.' },
              ].map((f, i) => (
                <div key={i} style={{ borderRadius: '12px', padding: '20px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0c4a6e', marginBottom: '8px', fontFamily: 'system-ui, sans-serif' }}>{f.title}</h4>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{f.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '30px' }}>
              <img src="/images/compliance-hero.jpg" alt="Technology" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            </div>

            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '12px', padding: '24px', color: '#ffffff' }}>
              <p style={{ fontSize: '15px', fontStyle: 'italic', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>
                &ldquo;CareCallAI was built by a care provider that understands the sector from the inside. It is not a tech company selling to care providers — it is a care provider that built the technology it needed.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* PAGE 6 — Quality & Compliance */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always' }}>
          <div style={{ padding: '50px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#166534', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>Quality Assurance</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '30px', fontFamily: 'system-ui, sans-serif' }}>
              Compliance &amp; Quality<br />at Every Level
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div>
                {[
                  { title: 'CIW Registered', desc: 'Fully registered with Care Inspectorate Wales as a domiciliary care provider, meeting all regulatory requirements.' },
                  { title: 'RISCA Compliant', desc: 'All operations comply with the Regulation and Inspection of Social Care (Wales) Act 2016, including Regulation 36 staff supervision.' },
                  { title: 'Safeguarding', desc: 'Robust safeguarding procedures with incident reporting built directly into the care management platform. Full audit trail from report to resolution.' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>{item.title}</h4>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, paddingLeft: '38px', fontFamily: 'system-ui, sans-serif' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
              <div>
                {[
                  { title: 'Staff Training', desc: 'Comprehensive induction and ongoing training programme covering all mandatory topics, specialist care skills, and professional development.' },
                  { title: 'Clinical Governance', desc: 'Digital clinical assessments, wound management tracking, falls recording with pattern analysis, and repositioning charts with gap detection.' },
                  { title: 'Quality Monitoring', desc: 'Regular audits, spot checks, client feedback reviews, and management oversight ensure consistent, high-quality care delivery at all times.' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>{item.title}</h4>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, paddingLeft: '38px', fontFamily: 'system-ui, sans-serif' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <img src="/images/ciw-compliance.jpg" alt="Compliance" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        {/* PAGE 7 — Areas We Cover */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always' }}>
          <div style={{ padding: '50px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#B91C1C', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>Coverage</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>
              Serving Communities<br />Across North Wales
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, marginBottom: '30px', fontFamily: 'system-ui, sans-serif' }}>
              Local care workers delivering care in the communities they know and love. Welsh speaking and English speaking staff available across all areas.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
              <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fff1f2)', borderRadius: '16px', padding: '28px', border: '1px solid #fecaca' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#B91C1C', marginBottom: '16px', fontFamily: 'system-ui, sans-serif' }}>Denbighshire</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['Denbigh', 'Ruthin', 'Llangollen', 'Corwen', 'St Asaph', 'Rhyl', 'Prestatyn', 'Bodelwyddan'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B91C1C' }} />
                      <span style={{ fontSize: '13px', color: '#475569', fontFamily: 'system-ui, sans-serif' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: '16px', padding: '28px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#166534', marginBottom: '16px', fontFamily: 'system-ui, sans-serif' }}>Conwy &amp; Beyond</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['Colwyn Bay', 'Abergele', 'Conwy', 'Llandudno', 'Wrexham', 'Cerrigydrudion', 'Betws-y-Coed', 'Llanrwst'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#166534' }} />
                      <span style={{ fontSize: '13px', color: '#475569', fontFamily: 'system-ui, sans-serif' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '30px' }}>
              <img src="/images/welsh-landscape.jpg" alt="North Wales" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600, marginBottom: '8px', fontFamily: 'system-ui, sans-serif' }}>
                Cymraeg a Saesneg — Welsh &amp; English
              </p>
              <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
                Many of the care team grew up in the same streets as the people they now look after. Whichever language feels like home, the service is delivered with warmth and understanding.
              </p>
            </div>
          </div>
        </div>

        {/* PAGE 8 — Contact */}
        <div className="brochure-page bg-white shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakBefore: 'always', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '40%', opacity: 0.08 }}>
            <img src="/images/contact.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '50px 60px', height: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '4px', background: '#B91C1C', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'system-ui, sans-serif' }}>Get in Touch</span>
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>
                Ready to Talk<br />About Care?
              </h2>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, marginBottom: '40px', maxWidth: '450px', fontFamily: 'system-ui, sans-serif' }}>
                Book a free, no-obligation consultation to discuss care needs. Whether at home, by video call, or over the phone — the team is here to help.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>Phone</h4>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>01824 538688</p>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>Email</h4>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>enquiries@accredilinkcare.co.uk</p>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>Website</h4>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>accredilinkcare.co.uk</p>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>Office</h4>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.5, fontFamily: 'system-ui, sans-serif' }}>The Hummingbird<br />27-29 High St<br />Denbigh LL16 3HY</p>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #B91C1C, #991B1B)', borderRadius: '12px', padding: '28px', color: '#ffffff', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', fontFamily: 'system-ui, sans-serif' }}>Book a Free Consultation</h3>
                <p style={{ fontSize: '14px', opacity: 0.9, fontFamily: 'system-ui, sans-serif' }}>
                  Call 01824 538688 or email enquiries@accredilinkcare.co.uk
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <img src="/images/logo.png" alt="Accredilink" style={{ height: '36px', opacity: 0.7 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>CIW Registered</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>Proudly Welsh</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>Family-Run</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .brochure-page { box-shadow: none !important; page-break-after: always; }
          .brochure-page:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}
