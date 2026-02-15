import { jsPDF } from 'npm:jspdf';
import { createClient } from 'npm:@supabase/supabase-js@2';


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

    const body = await req.json();
    const invoice = body.invoice;

    if (!invoice) {
      return Response.json({ error: 'Invoice data required' }, { status: 400 });
    }

    const settings = await supabase.entities.InvoicingSettings.list();
    const companySettings = settings[0] || {};

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const brandColor = companySettings.brand_color || '#0f766e';
    const brandRGB = hexToRgb(brandColor);
    const margin = 20;

    let yPosition = margin;

    const addHeader = () => {
      yPosition = margin;
      
      // Header background
      doc.setFillColor(brandRGB.r, brandRGB.g, brandRGB.b);
      doc.rect(0, 0, pageWidth, 50, 'F');

      // Logo
      if (companySettings.logo_url) {
        try {
          doc.addImage(companySettings.logo_url, 'PNG', margin, 8, 18, 18);
        } catch (e) {
          // Logo failed to load
        }
      }

      // Company Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(companySettings.company_name || 'Company', margin + 22, 20);

      // Reset
      doc.setTextColor(0, 0, 0);
      yPosition = 65;
    };

    const addFooter = () => {
      const footerY = pageHeight - 20;
      
      doc.setFillColor(brandRGB.r, brandRGB.g, brandRGB.b);
      doc.rect(0, footerY, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      let footerText = companySettings.company_name || 'Company';
      if (companySettings.company_address) footerText += ` | ${companySettings.company_address}`;
      if (companySettings.company_city) footerText += `, ${companySettings.company_city}`;
      if (companySettings.company_postcode) footerText += ` ${companySettings.company_postcode}`;
      if (companySettings.company_phone) footerText += ` | ${companySettings.company_phone}`;

      doc.text(footerText, pageWidth / 2, footerY + 8, { align: 'center', maxWidth: pageWidth - 40 });
    };

    addHeader();

    // Invoice details box (right side)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    
    const detailsX = pageWidth - margin - 60;
    doc.text('Invoice #:', detailsX, yPosition);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.invoice_number, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Date:', detailsX, yPosition);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(new Date(invoice.invoice_date).toLocaleDateString(), pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Due:', detailsX, yPosition);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(new Date(invoice.due_date).toLocaleDateString(), pageWidth - margin, yPosition, { align: 'right' });

    yPosition += 15;

    // Bill To section
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandRGB.r, brandRGB.g, brandRGB.b);
    doc.text('BILL TO', margin, yPosition);
    
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.client_name, margin, yPosition);
    
    yPosition += 5;
    if (invoice.client_email) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Email: ${invoice.client_email}`, margin, yPosition);
      yPosition += 4;
    }

    // Service User section (if available)
    if (invoice.service_user_id) {
      yPosition += 4;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(brandRGB.r, brandRGB.g, brandRGB.b);
      doc.text('SERVICE USER', margin, yPosition);
      
      yPosition += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(invoice.service_user_id, margin, yPosition);
      yPosition += 4;
    }

    yPosition += 8;

    // Parse line items
    let lineItems = [];
    let dayItems = {};
    try {
      lineItems = JSON.parse(invoice.line_items || '[]');
    } catch (e) {
      lineItems = [];
    }
    
    if (invoice.repeating_days && invoice.repeating_days.length > 0) {
      try {
        dayItems = JSON.parse(invoice.day_items || '{}');
      } catch (e) {
        dayItems = {};
      }
    }

    // Line items table
    if (invoice.repeating_days && invoice.repeating_days.length > 0 && Object.keys(dayItems).length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      invoice.repeating_days.forEach(dayIdx => {
        if (yPosition > pageHeight - 60) {
          addFooter();
          doc.addPage();
          addHeader();
        }

        // Day header
        doc.setFillColor(brandRGB.r, brandRGB.g, brandRGB.b);
        doc.rect(margin, yPosition - 1, pageWidth - 2 * margin, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(dayNames[dayIdx], margin + 2, yPosition + 2);
        doc.setTextColor(0, 0, 0);
        
        yPosition += 7;

        const dayItemsList = dayItems[dayIdx] || [];
        dayItemsList.forEach(item => {
          if (yPosition > pageHeight - 60) {
            addFooter();
            doc.addPage();
            addHeader();
          }

          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          const itemTotal = (item.quantity || 0) * (item.unit_price || 0) * (item.double_handed ? 2 : 1);
          
          doc.text((item.description || '').substring(0, 50), margin, yPosition);
          doc.text(String(item.quantity || 0), 95, yPosition);
          doc.text(`Â£${(item.unit_price || 0).toFixed(2)}`, 120, yPosition);
          if (item.double_handed) doc.text('(x2)', 150, yPosition);
          doc.text(`Â£${itemTotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
          
          yPosition += 4;
        });
        yPosition += 4;
      });
    } else {
      // Regular line items table header
      doc.setFillColor(brandRGB.r, brandRGB.g, brandRGB.b);
      doc.rect(margin, yPosition - 1, pageWidth - 2 * margin, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Description', margin + 2, yPosition + 2);
      doc.text('Qty', 95, yPosition + 2);
      doc.text('Rate', 120, yPosition + 2);
      doc.text('Amount', pageWidth - margin, yPosition + 2, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      yPosition += 7;

      lineItems.forEach(item => {
        if (yPosition > pageHeight - 60) {
          addFooter();
          doc.addPage();
          addHeader();
        }

        const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text((item.description || '').substring(0, 50), margin, yPosition);
        doc.text(String(item.quantity || 0), 95, yPosition);
        doc.text(`Â£${(item.unit_price || 0).toFixed(2)}`, 120, yPosition);
        doc.text(`Â£${itemTotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 4;
      });
    }

    yPosition += 8;

    // Totals section
    const totalsX = 130;
    const totalsWidth = pageWidth - totalsX - margin;

    doc.setFillColor(245, 245, 245);
    doc.rect(totalsX, yPosition, totalsWidth, 20, 'F');

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    
    doc.text('Subtotal:', totalsX + 3, yPosition + 4);
    doc.text(`Â£${(invoice.subtotal || 0).toFixed(2)}`, pageWidth - margin - 1, yPosition + 4, { align: 'right' });

    if (invoice.tax_amount && invoice.tax_amount > 0) {
      doc.text('Tax:', totalsX + 3, yPosition + 9);
      doc.text(`Â£${(invoice.tax_amount || 0).toFixed(2)}`, pageWidth - margin - 1, yPosition + 9, { align: 'right' });
    }

    if (invoice.discount_amount && invoice.discount_amount > 0) {
      doc.text('Discount:', totalsX + 3, yPosition + 14);
      doc.text(`-Â£${(invoice.discount_amount || 0).toFixed(2)}`, pageWidth - margin - 1, yPosition + 14, { align: 'right' });
    }

    yPosition += 22;

    // Total box
    doc.setFillColor(brandRGB.r, brandRGB.g, brandRGB.b);
    doc.rect(totalsX, yPosition, totalsWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', totalsX + 3, yPosition + 4.5);
    doc.text(`Â£${(invoice.total_amount || 0).toFixed(2)}`, pageWidth - margin - 1, yPosition + 4.5, { align: 'right' });

    yPosition += 12;

    // Notes
    if (invoice.notes) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(brandRGB.r, brandRGB.g, brandRGB.b);
      doc.text('Notes:', margin, yPosition);
      
      yPosition += 4;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPosition);
    }

    addFooter();

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 15, g: 118, b: 110 };
}
