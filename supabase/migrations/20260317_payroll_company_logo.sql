-- Add company_logo column to payroll_records for payslip branding
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS company_logo TEXT;
