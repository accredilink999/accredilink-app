import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from 'lucide-react';

export default function PayPeriodManager({ payPeriod, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    period_start: payPeriod?.period_start || '',
    period_end: payPeriod?.period_end || '',
    pay_date: payPeriod?.pay_date || ''
  });

  const handleSave = async () => {
    try {
      if (payPeriod?.id) {
        await base44.entities.PayPeriod?.update(payPeriod.id, formData);
      } else {
        await base44.entities.PayPeriod?.create(formData);
      }
      onUpdate();
      setEditing(false);
    } catch (error) {
      alert('Error saving pay period');
    }
  };

  if (!editing) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Current Pay Period</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>Period: {payPeriod?.period_start || 'Not set'} to {payPeriod?.period_end || 'Not set'}</p>
              <p>Pay Date: {payPeriod?.pay_date || 'Not set'}</p>
            </div>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <h3 className="font-semibold text-slate-900 mb-4">Set Pay Period</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Period Start Date</label>
            <Input
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Period End Date</label>
            <Input
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Pay Date</label>
            <Input
              type="date"
              value={formData.pay_date}
              onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Save Pay Period
          </Button>
          <Button 
            variant="outline"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}