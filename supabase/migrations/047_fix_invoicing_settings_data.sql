-- Clean up: remove ALL invoicing_settings rows and insert one good one
DELETE FROM invoicing_settings;

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
);
