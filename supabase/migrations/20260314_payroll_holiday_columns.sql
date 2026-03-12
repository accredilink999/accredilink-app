-- Add holiday/leave columns to payroll_records for payslip display
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS holiday_days NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS holiday_hours NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS holiday_pay NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS ni_category TEXT;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS pension_percent NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS ni_number TEXT;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS employer_paye_ref TEXT;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer';
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'hourly';
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS annual_salary NUMERIC;
