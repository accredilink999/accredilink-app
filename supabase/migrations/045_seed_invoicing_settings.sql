-- Skip the setup wizard by inserting a configured settings row
-- User can update all details later from the Settings tab
INSERT INTO invoicing_settings (
  company_name,
  company_email,
  currency,
  default_tax_rate,
  payment_terms,
  invoice_prefix,
  brand_color,
  is_configured
) VALUES (
  'CareCall AI',
  'info@carecallai.app',
  'GBP',
  0,
  'Net 30',
  'INV',
  '#0f766e',
  true
)
ON CONFLICT DO NOTHING;
