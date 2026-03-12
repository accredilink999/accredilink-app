import React from 'react';

const PrintablePayslip = React.forwardRef(({ record, settings }, ref) => {
  const deductions = typeof record.deductions === 'string'
    ? JSON.parse(record.deductions)
    : (record.deductions || {});

  const brandColor = '#0f766e';
  const periodStart = record.period_start ? new Date(record.period_start).toLocaleDateString('en-GB') : '';
  const periodEnd = record.period_end ? new Date(record.period_end).toLocaleDateString('en-GB') : '';
  const paymentDate = record.payment_date ? new Date(record.payment_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  const totalDeductions = (deductions.tax || 0) + (deductions.ni || 0) + (deductions.pension || 0) + (deductions.other || 0);

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: 'white',
        padding: '15mm 20mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937',
        lineHeight: '1.4',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', paddingBottom: '12px', borderBottom: `3px solid ${brandColor}` }}>
        <div>
          <h1 style={{ margin: '0', fontSize: '22px', fontWeight: 'bold', color: brandColor }}>
            {record.company_name || settings?.company_name || 'Company Name'}
          </h1>
          {(record.employer_paye_ref || settings?.tax_id) && (
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#6b7280' }}>
              PAYE Ref: {record.employer_paye_ref || settings?.tax_id}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0', fontSize: '36px', fontWeight: 'bold', color: '#d1d5db', letterSpacing: '2px' }}>PAYSLIP</h2>
        </div>
      </div>

      {/* Employee & Period Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Employee Details
          </h3>
          <table style={{ fontSize: '12px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280', fontWeight: 'bold' }}>Name:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold', fontSize: '13px' }}>{record.staff_name}</td>
              </tr>
              {record.ni_number && (
                <tr>
                  <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>NI Number:</td>
                  <td style={{ padding: '2px 0', fontFamily: 'monospace' }}>{record.ni_number}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>Tax Code:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{record.tax_code || '1257L'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>NI Category:</td>
                <td style={{ padding: '2px 0' }}>{record.ni_category || 'A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pay Period
          </h3>
          <table style={{ fontSize: '12px', borderCollapse: 'collapse', marginLeft: 'auto' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>Period:</td>
                <td style={{ padding: '2px 0' }}>{periodStart} – {periodEnd}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>Payment Date:</td>
                <td style={{ padding: '2px 0' }}>{paymentDate}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>Payment Method:</td>
                <td style={{ padding: '2px 0', textTransform: 'capitalize' }}>{(record.payment_method || 'Bank Transfer').replace(/_/g, ' ')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Earnings Table */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Earnings
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: brandColor, color: 'white' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', width: '80px' }}>Hours</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '80px' }}>Rate</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px 10px' }}>Basic Pay</td>
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{(record.regular_hours || 0).toFixed(2)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>£{(record.hourly_rate || 0).toFixed(2)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                £{((record.regular_hours || 0) * (record.hourly_rate || 0)).toFixed(2)}
              </td>
            </tr>
            {record.overtime_hours > 0 && (
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 10px' }}>Overtime</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{(record.overtime_hours || 0).toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>£{(record.overtime_rate || 0).toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                  £{((record.overtime_hours || 0) * (record.overtime_rate || 0)).toFixed(2)}
                </td>
              </tr>
            )}
            <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
              <td colSpan={3} style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>Gross Pay</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                £{(record.gross_pay || 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions Table */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Deductions
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#dc2626', color: 'white' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px 10px' }}>PAYE Income Tax ({record.tax_code || '1257L'})</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626' }}>£{(deductions.tax || 0).toFixed(2)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px 10px' }}>National Insurance (Cat {record.ni_category || 'A'})</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626' }}>£{(deductions.ni || 0).toFixed(2)}</td>
            </tr>
            {deductions.pension > 0 && (
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 10px' }}>Pension ({record.pension_percent || 0}%)</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626' }}>£{(deductions.pension || 0).toFixed(2)}</td>
              </tr>
            )}
            {deductions.other > 0 && (
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 10px' }}>{deductions.other_label || 'Other Deductions'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626' }}>£{(deductions.other || 0).toFixed(2)}</td>
              </tr>
            )}
            <tr style={{ backgroundColor: '#fef2f2', borderTop: '2px solid #e5e7eb' }}>
              <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>Total Deductions</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626', fontSize: '13px' }}>
                £{totalDeductions.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay Box */}
      <div style={{
        backgroundColor: brandColor,
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>NET PAY</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>£{(record.net_pay || 0).toFixed(2)}</span>
      </div>

      {/* Summary Grid */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#f0fdfa', padding: '12px', borderRadius: '8px', border: '1px solid #99f6e4', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Gross Pay</p>
          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#0f766e' }}>£{(record.gross_pay || 0).toFixed(2)}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Deductions</p>
          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>£{totalDeductions.toFixed(2)}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Net Pay</p>
          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>£{(record.net_pay || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '15px', borderTop: `2px solid ${brandColor}`, fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: '3px 0' }}>
          {record.company_name || settings?.company_name || ''}
          {(record.employer_paye_ref || settings?.tax_id) && ` | PAYE Ref: ${record.employer_paye_ref || settings?.tax_id}`}
        </p>
        <p style={{ margin: '3px 0', fontStyle: 'italic' }}>
          This payslip is for information purposes. Please retain for your records.
        </p>
      </div>
    </div>
  );
});

PrintablePayslip.displayName = 'PrintablePayslip';

export default PrintablePayslip;
