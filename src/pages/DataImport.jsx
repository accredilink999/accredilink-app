import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Play,
  Eye,
  Database,
} from 'lucide-react';

// All importable tables mapped from Base44 entity names
const TABLES = [
  { entity: 'ServiceUser', table: 'service_users', label: 'Service Users (Clients)' },
  { entity: 'Shift', table: 'shifts', label: 'Shifts' },
  { entity: 'ShiftCall', table: 'shift_calls', label: 'Shift Calls' },
  { entity: 'ClientCall', table: 'client_calls', label: 'Client Calls' },
  { entity: 'CareLog', table: 'care_logs', label: 'Care Logs' },
  { entity: 'HealthcareLog', table: 'healthcare_logs', label: 'Healthcare Logs' },
  { entity: 'Notification', table: 'notifications', label: 'Notifications' },
  { entity: 'Message', table: 'messages', label: 'Messages' },
  { entity: 'Conversation', table: 'conversations', label: 'Conversations' },
  { entity: 'Invoice', table: 'invoices', label: 'Invoices' },
  { entity: 'Expense', table: 'expenses', label: 'Expenses' },
  { entity: 'LeaveRequest', table: 'leave_requests', label: 'Leave Requests' },
  { entity: 'PayPeriod', table: 'pay_periods', label: 'Pay Periods' },
  { entity: 'PayrollRecord', table: 'payroll_records', label: 'Payroll Records' },
  { entity: 'Training', table: 'trainings', label: 'Trainings' },
  { entity: 'Course', table: 'courses', label: 'Courses' },
  { entity: 'CourseAssignment', table: 'course_assignments', label: 'Course Assignments' },
  { entity: 'TrainingCertificate', table: 'training_certificates', label: 'Training Certificates' },
  { entity: 'TrainingMatrixRecord', table: 'training_matrix_records', label: 'Training Matrix Records' },
  { entity: 'TrainingMatrixItem', table: 'training_matrix_items', label: 'Training Matrix Items' },
  { entity: 'Document', table: 'documents', label: 'Documents' },
  { entity: 'HRDocument', table: 'hr_documents', label: 'HR Documents' },
  { entity: 'MedicationRecord', table: 'medication_records', label: 'Medication Records' },
  { entity: 'Assessment', table: 'assessments', label: 'Assessments' },
  { entity: 'SicknessRecord', table: 'sickness_records', label: 'Sickness Records' },
  { entity: 'Incident', table: 'incidents', label: 'Incidents' },
  { entity: 'AuditLog', table: 'audit_logs', label: 'Audit Logs' },
  { entity: 'Location', table: 'locations', label: 'Locations' },
  { entity: 'Asset', table: 'assets', label: 'Assets' },
  { entity: 'CareTeam', table: 'care_teams', label: 'Care Teams' },
  { entity: 'Form', table: 'forms', label: 'Forms' },
  { entity: 'FormSubmission', table: 'form_submissions', label: 'Form Submissions' },
  { entity: 'WorkCalendarEvent', table: 'work_calendar_events', label: 'Work Calendar Events' },
  { entity: 'SharedFile', table: 'shared_files', label: 'Shared Files' },
  { entity: 'Payment', table: 'payments', label: 'Payments' },
  { entity: 'HolidayAllowance', table: 'holiday_allowances', label: 'Holiday Allowances' },
];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header
  const headers = parseLine(lines[0]);

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        let val = values[idx];
        // Clean up values
        if (val === '' || val === 'null' || val === 'NULL') val = null;
        else if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (/^\d+$/.test(val) && val.length < 15) val = parseInt(val, 10);
        else if (/^\d+\.\d+$/.test(val) && val.length < 20) val = parseFloat(val);
        row[h] = val;
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Convert Base44 camelCase field names to snake_case
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

export default function DataImport() {
  const { user } = useAuth();
  const fileRef = useRef();
  const [selectedTable, setSelectedTable] = useState('');
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [convertFields, setConvertFields] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager';

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parseCSV(evt.target.result);
        if (parsed.rows.length === 0) {
          toast.error('CSV file is empty or invalid');
          return;
        }
        setCsvData(parsed);
        toast.success(`Loaded ${parsed.rows.length} rows with ${parsed.headers.length} columns`);
      } catch (err) {
        toast.error('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getProcessedRows = () => {
    if (!csvData) return [];
    return csvData.rows.map(row => {
      const processed = {};
      for (const [key, val] of Object.entries(row)) {
        // Skip Base44 internal fields
        if (key === '__v' || key === '_id') continue;
        // Convert field name if enabled
        const fieldName = convertFields ? toSnakeCase(key) : key;
        // Skip 'id' field — let Supabase auto-generate
        if (fieldName === 'id') continue;
        processed[fieldName] = val;
      }
      return processed;
    });
  };

  const handleImport = async () => {
    if (!selectedTable || !csvData) {
      toast.error('Select a table and upload a CSV first');
      return;
    }

    const tableConfig = TABLES.find(t => t.table === selectedTable);
    const rows = getProcessedRows();

    setImporting(true);
    setResults(null);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Import in batches of 50
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      try {
        const { error } = await supabase.from(selectedTable).insert(batch);
        if (error) {
          errorCount += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        errorCount += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message}`);
      }
    }

    setResults({ successCount, errorCount, errors, tableName: tableConfig.label });
    setImporting(false);

    if (errorCount === 0) {
      toast.success(`Successfully imported ${successCount} records into ${tableConfig.label}`);
    } else {
      toast.error(`Imported ${successCount}, failed ${errorCount}. Check details below.`);
    }
  };

  const handleClear = () => {
    setCsvData(null);
    setFileName('');
    setResults(null);
  };

  if (!isAdmin) {
    return <div className="p-6 text-center text-slate-500">Admin access required.</div>;
  }

  const processedRows = csvData ? getProcessedRows() : [];
  const processedHeaders = processedRows.length > 0 ? Object.keys(processedRows[0]) : [];

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader
        title="Data Import"
        subtitle="Import CSV data from Base44 into the app"
        tutorialKey="DataImport"
      />

      {/* Step 1: Select table */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Step 1: Select Target Table
        </h3>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="">-- Select a table --</option>
          {TABLES.map(t => (
            <option key={t.table} value={t.table}>
              {t.label} ({t.table})
            </option>
          ))}
        </select>
      </Card>

      {/* Step 2: Upload CSV */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          Step 2: Upload CSV File
        </h3>

        <div className="flex items-center gap-3 mb-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button asChild variant="outline" className="cursor-pointer">
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {fileName || 'Choose CSV file'}
              </span>
            </Button>
          </label>
          {csvData && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Field name conversion toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
          <input
            type="checkbox"
            checked={convertFields}
            onChange={(e) => setConvertFields(e.target.checked)}
            className="rounded"
          />
          Convert camelCase field names to snake_case (recommended for Base44 exports)
        </label>

        {csvData && (
          <div className="text-sm text-slate-600 bg-slate-50 rounded p-3">
            <p><strong>{csvData.rows.length}</strong> rows, <strong>{csvData.headers.length}</strong> columns</p>
            <p className="text-xs text-slate-400 mt-1">
              Original columns: {csvData.headers.join(', ')}
            </p>
            {convertFields && (
              <p className="text-xs text-slate-400 mt-1">
                Mapped to: {processedHeaders.join(', ')}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Step 3: Preview */}
      {csvData && processedRows.length > 0 && (
        <Card className="p-5 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Step 3: Preview (first 5 rows)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {processedHeaders.map(h => (
                    <th key={h} className="p-2 text-left font-medium text-slate-700 border border-slate-200 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {processedHeaders.map(h => (
                      <td key={h} className="p-2 text-slate-600 border border-slate-200 max-w-[200px] truncate">
                        {row[h] === null ? <span className="text-slate-300">null</span> : String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {processedRows.length > 5 && (
            <p className="text-xs text-slate-400 mt-2">
              ... and {processedRows.length - 5} more rows
            </p>
          )}
        </Card>
      )}

      {/* Step 4: Import */}
      {csvData && selectedTable && (
        <Card className="p-5 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-teal-600" />
            Step 4: Import
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Ready to import <strong>{processedRows.length}</strong> rows into{' '}
            <strong>{TABLES.find(t => t.table === selectedTable)?.label}</strong> ({selectedTable})
          </p>
          <Button
            onClick={handleImport}
            disabled={importing}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {processedRows.length} Records
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card className={`p-5 border-0 shadow-sm ${results.errorCount === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            {results.errorCount === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            Import Results: {results.tableName}
          </h3>
          <div className="text-sm space-y-1">
            <p className="text-green-700">Successful: {results.successCount}</p>
            {results.errorCount > 0 && (
              <>
                <p className="text-red-700">Failed: {results.errorCount}</p>
                <div className="mt-2 bg-white rounded p-3 border border-red-200">
                  <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                  {results.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Help */}
      <Card className="p-4 bg-slate-50 border-0">
        <h4 className="font-medium text-slate-700 text-sm mb-2">Import Tips</h4>
        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
          <li>Export each entity from Base44 as a separate CSV file</li>
          <li>Add staff/users manually first to ensure user IDs match</li>
          <li>Import in order: Clients → Shifts → Care Logs → everything else</li>
          <li>The "id" column is automatically skipped (Supabase generates new IDs)</li>
          <li>camelCase fields (e.g. "firstName") are converted to snake_case ("first_name")</li>
          <li>Empty values and "null" strings are treated as null</li>
          <li>Data is imported in batches of 50 rows for reliability</li>
        </ul>
      </Card>
    </div>
  );
}
