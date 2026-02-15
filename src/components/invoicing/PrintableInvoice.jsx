import React from 'react';

const PrintableInvoice = React.forwardRef(({ invoice, settings, serviceUser, client }, ref) => {
  const lineItems = JSON.parse(invoice.line_items || '[]');
  const dayItems = JSON.parse(invoice.day_items || '{}');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const brandColor = settings?.brand_color || '#0f766e';

  return (
    <div 
      ref={ref}
      style={{ 
        width: '210mm', 
        minHeight: '297mm',
        backgroundColor: 'white',
        padding: '20mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937',
        lineHeight: '1.4'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '15px', borderBottom: `3px solid ${brandColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: brandColor }}>
              {settings?.company_name || 'Company'}
            </h1>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0', fontSize: '48px', fontWeight: 'bold', color: '#d1d5db' }}>INVOICE</h2>
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', marginTop: '15px' }}>
        <div />
        <div style={{ textAlign: 'right', fontSize: '13px' }}>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ color: '#6b7280', fontWeight: 'bold' }}>Invoice #: </span>
            <span>{invoice.invoice_number}</span>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ color: '#6b7280', fontWeight: 'bold' }}>Date: </span>
            <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280', fontWeight: 'bold' }}>Due: </span>
            <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Bill To
        </h3>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
          {invoice.client_name}
        </h2>
        {invoice.client_email && (
          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
            Email: {invoice.client_email}
          </p>
        )}
      </div>

      {/* Service User Section */}
      {invoice.service_user_id && serviceUser && (
        <div style={{ marginBottom: '25px', paddingTop: '15px', borderTop: `1px solid #e5e7eb` }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Service User
          </h3>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
            {serviceUser.full_name}
          </h2>
          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
            {serviceUser.address}
          </p>
          {serviceUser.postcode && (
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              {serviceUser.postcode}
            </p>
          )}
        </div>
      )}

      {/* Line Items */}
      <div style={{ marginBottom: '25px', marginTop: '30px' }}>
        {invoice.repeating_days && invoice.repeating_days.length > 0 && Object.keys(dayItems).length > 0 ? (
          // Day-based items
          invoice.repeating_days.map(dayIdx => (
            <div key={dayIdx} style={{ marginBottom: '20px' }}>
              <div style={{ backgroundColor: brandColor, color: 'white', padding: '8px 12px', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                {dayNames[dayIdx]}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {(dayItems[dayIdx] || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px', textAlign: 'left', flex: 1 }}>{item.description || ''}</td>
                      <td style={{ padding: '8px', textAlign: 'center', width: '60px' }}>{item.quantity || 0}</td>
                      <td style={{ padding: '8px', textAlign: 'right', width: '70px' }}>£{(item.unit_price || 0).toFixed(2)}</td>
                      {item.double_handed && <td style={{ padding: '8px', textAlign: 'center', width: '40px' }}>(x2)</td>}
                      <td style={{ padding: '8px', textAlign: 'right', width: '70px', fontWeight: 'bold' }}>
                        £{((item.quantity || 0) * (item.unit_price || 0) * (item.double_handed ? 2 : 1)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          // Regular items
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: brandColor, color: 'white' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '70px' }}>Rate</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '70px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px', textAlign: 'left' }}>{item.description || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity || 0}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>£{(item.unit_price || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                    £{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', gap: '80px' }}>
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #d1d5db' }}>
            <span style={{ marginRight: '30px' }}>Subtotal:</span>
            <span style={{ fontWeight: 'bold' }}>£{(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          {invoice.tax_amount > 0 && (
            <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #d1d5db' }}>
              <span style={{ marginRight: '60px' }}>Tax:</span>
              <span style={{ fontWeight: 'bold' }}>£{(invoice.tax_amount || 0).toFixed(2)}</span>
            </div>
          )}
          {invoice.discount_amount > 0 && (
            <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #d1d5db' }}>
              <span style={{ marginRight: '40px' }}>Discount:</span>
              <span style={{ fontWeight: 'bold' }}>-£{(invoice.discount_amount || 0).toFixed(2)}</span>
            </div>
          )}
          <div style={{ backgroundColor: brandColor, color: 'white', padding: '10px 15px', marginTop: '10px', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' }}>
            TOTAL: £{(invoice.total_amount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase' }}>
            Notes
          </h3>
          <p style={{ margin: '0', fontSize: '11px', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: `2px solid ${brandColor}`, fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: '5px 0' }}>
          {settings?.company_name}
          {settings?.company_address && ` | ${settings.company_address}`}
          {settings?.company_city && `, ${settings.company_city}`}
          {settings?.company_postcode && ` ${settings.company_postcode}`}
          {settings?.company_phone && ` | ${settings.company_phone}`}
        </p>
      </div>
    </div>
  );
});

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;