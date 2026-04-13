import React from 'react';

const PrintableMileageSlip = React.forwardRef(({ group, mileageRatePpm, settings }, ref) => {
  const brandColor = '#0f766e';
  const companyName = settings?.company_name || 'Company Name';
  const companyLogo = settings?.company_logo || null;
  const mileageRate = (mileageRatePpm || 45) / 100;

  const weekStartStr = group.weekStart
    ? new Date(group.weekStart).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const weekEndStr = group.weekEnd
    ? new Date(group.weekEnd).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const paymentDateStr = group.paymentDue
    ? new Date(group.paymentDue).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const sortedExpenses = [...(group.expenses || [])].sort(
    (a, b) => new Date(a.date || a.expense_date) - new Date(b.date || b.expense_date)
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {companyLogo && (
            <img
              src={companyLogo}
              alt="Company Logo"
              style={{ height: '50px', maxWidth: '120px', objectFit: 'contain' }}
              crossOrigin="anonymous"
            />
          )}
          <div>
            <h1 style={{ margin: '0', fontSize: '22px', fontWeight: 'bold', color: brandColor }}>
              {companyName}
            </h1>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0', fontSize: '30px', fontWeight: 'bold', color: '#d1d5db', letterSpacing: '2px' }}>MILEAGE SLIP</h2>
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
                <td style={{ padding: '2px 0', fontWeight: 'bold', fontSize: '13px' }}>{group.staffName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payment Period
          </h3>
          <table style={{ fontSize: '12px', borderCollapse: 'collapse', marginLeft: 'auto' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>From:</td>
                <td style={{ padding: '2px 0' }}>{weekStartStr}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>To:</td>
                <td style={{ padding: '2px 0' }}>{weekEndStr}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>Payment Date:</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{paymentDateStr}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 15px 2px 0', color: '#6b7280' }}>Rate:</td>
                <td style={{ padding: '2px 0' }}>{mileageRatePpm}p per mile</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Mileage Breakdown Table */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Daily Mileage Breakdown
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: brandColor, color: 'white' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>Miles</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>Rate</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', width: '100px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((exp, i) => {
              const miles = parseFloat(exp.mileage_distance || exp.mileage || 0);
              const amount = miles * mileageRate;
              const expDate = new Date(exp.date || exp.expense_date || exp.created_at);
              return (
                <tr key={exp.id || i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 10px' }}>
                    {expDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{miles.toFixed(1)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{mileageRatePpm}p</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                    {'\u00A3'}{amount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
              <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>Total</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                {group.totalMiles.toFixed(1)}
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}></td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                {'\u00A3'}{group.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total Payment Box */}
      <div style={{
        backgroundColor: brandColor,
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL MILEAGE PAYMENT</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{'\u00A3'}{group.totalAmount.toFixed(2)}</span>
      </div>

      {/* Summary Grid */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#f0fdfa', padding: '12px', borderRadius: '8px', border: '1px solid #99f6e4', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Total Miles</p>
          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#0f766e' }}>{group.totalMiles.toFixed(1)}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f0fdfa', padding: '12px', borderRadius: '8px', border: '1px solid #99f6e4', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Journeys</p>
          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#0f766e' }}>{sortedExpenses.length}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Amount Paid</p>
          <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>{'\u00A3'}{group.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '15px', borderTop: `2px solid ${brandColor}`, fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: '3px 0' }}>
          {companyName} | Mileage rate: {mileageRatePpm}p per mile
        </p>
        <p style={{ margin: '3px 0', fontStyle: 'italic' }}>
          This mileage payment slip is for your records. Mileage is not subject to PAYE tax or National Insurance.
        </p>
      </div>
    </div>
  );
});

PrintableMileageSlip.displayName = 'PrintableMileageSlip';

export default PrintableMileageSlip;
