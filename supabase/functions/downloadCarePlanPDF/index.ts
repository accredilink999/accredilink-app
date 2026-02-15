import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@2.5.2';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
  try {
      if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceUserId } = await req.json();

    if (!serviceUserId) {
      return Response.json({ error: 'Service user ID required' }, { status: 400 });
    }

    const serviceUser = await supabaseAdmin.entities.ServiceUser.get(serviceUserId);

    if (!serviceUser) {
      return Response.json({ error: 'Service user not found' }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Company header
    doc.setFillColor(16, 185, 129); // teal color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Accredi-Care', margin, 15);
    doc.setFontSize(10);
    doc.text('Care Management System', margin, 25);
    
    doc.setTextColor(0, 0, 0);
    yPosition = 50;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('CARE PLAN', margin, yPosition);
    yPosition += 10;

    // Client name and date
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Client: ${serviceUser.full_name}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin, yPosition);
    yPosition += 10;

    // Helper function to add section
    const addSection = (title, content) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(title, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const lines = doc.splitTextToSize(content, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 8;
    };

    // Personal Information
    const personalInfo = `
Name: ${serviceUser.full_name}
Date of Birth: ${serviceUser.date_of_birth || 'Not provided'}
Address: ${serviceUser.address}${serviceUser.postcode ? ', ' + serviceUser.postcode : ''}
Phone: ${serviceUser.phone || 'Not provided'}
Status: ${serviceUser.status.replace('_', ' ')}
Key Safe Code: ${serviceUser.key_safe_code || 'Not provided'}`.trim();
    addSection('PERSONAL INFORMATION', personalInfo);

    // Emergency Contact
    if (serviceUser.emergency_contact_name || serviceUser.emergency_contact_phone) {
      const emergencyInfo = `
Name: ${serviceUser.emergency_contact_name || 'Not provided'}
Phone: ${serviceUser.emergency_contact_phone || 'Not provided'}
Relationship: ${serviceUser.emergency_contact_relationship || 'Not provided'}`.trim();
      addSection('EMERGENCY CONTACT', emergencyInfo);
    }

    // Medical Information
    if (serviceUser.gp_name || serviceUser.nhs_number || serviceUser.allergies || serviceUser.dietary_requirements) {
      const medicalInfo = `
GP: ${serviceUser.gp_name || 'Not provided'}
GP Phone: ${serviceUser.gp_phone || 'Not provided'}
NHS Number: ${serviceUser.nhs_number || 'Not provided'}
Allergies: ${serviceUser.allergies || 'None known'}
Dietary Requirements: ${serviceUser.dietary_requirements || 'None'}
Mobility Level: ${serviceUser.mobility_level || 'Not specified'}`.trim();
      addSection('MEDICAL INFORMATION', medicalInfo);
    }

    // Care Details
    if (serviceUser.communication_needs || serviceUser.preferences) {
      const careDetails = `
Communication Needs: ${serviceUser.communication_needs || 'None specified'}
Preferences: ${serviceUser.preferences || 'None specified'}`.trim();
      addSection('CARE DETAILS', careDetails);
    }

    // Risk Assessments
    if (serviceUser.risk_assessments) {
      addSection('RISK ASSESSMENTS', serviceUser.risk_assessments);
    }

    // Call Times
    if (serviceUser.call_times && serviceUser.call_times.length > 0) {
      const callsText = serviceUser.call_times
        .map(call => `${call.time} (${call.duration} mins) - ${call.type}${call.notes ? ': ' + call.notes : ''}`)
        .join('\n');
      addSection('SCHEDULED CALL TIMES', callsText);
    }

    // Care Plan
    if (serviceUser.care_plan) {
      addSection('COMPREHENSIVE CARE PLAN', serviceUser.care_plan);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Accredi-Care - Care Management System | Page ${doc.internal.getNumberOfPages()}`, margin, pageHeight - 10);

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="care-plan-${serviceUser.full_name.replace(/\s+/g, '-')}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
