import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from 'lucide-react';

export default function SubmitExpense({ userId, userName }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    expense_type: 'mileage',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    mileage_distance: '',
    mileage_rate: '0.45'
  });

  const [receiptFile, setReceiptFile] = useState(null);

  const uploadReceiptMutation = useMutation({
    mutationFn: (file) => base44.integrations.Core.UploadFile({ file }),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setFormData({
        expense_type: 'mileage',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        mileage_distance: '',
        mileage_rate: '0.45'
      });
      setReceiptFile(null);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let receiptUrl = null;
    if (receiptFile) {
      const result = await uploadReceiptMutation.mutateAsync(receiptFile);
      receiptUrl = result.file_url;
    }

    let finalAmount = parseFloat(formData.amount);
    if (formData.expense_type === 'mileage' && formData.mileage_distance) {
      finalAmount = parseFloat(formData.mileage_distance) * parseFloat(formData.mileage_rate);
    }

    createExpenseMutation.mutate({
      staff_id: userId,
      staff_name: userName,
      expense_type: formData.expense_type,
      amount: finalAmount,
      date: formData.date,
      description: formData.description,
      mileage_distance: formData.mileage_distance ? parseFloat(formData.mileage_distance) : undefined,
      mileage_rate: formData.mileage_rate ? parseFloat(formData.mileage_rate) : undefined,
      receipt_url: receiptUrl,
      status: 'pending'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expense Type</Label>
              <Select value={formData.expense_type} onValueChange={(value) => setFormData({...formData, expense_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mileage">Mileage</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          {formData.expense_type === 'mileage' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance (miles)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.mileage_distance}
                  onChange={(e) => setFormData({...formData, mileage_distance: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rate per mile</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.mileage_rate}
                  onChange={(e) => setFormData({...formData, mileage_rate: e.target.value})}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Amount (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the expense..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt (Optional)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files[0])}
            />
          </div>

          <Button
            type="submit"
            disabled={createExpenseMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {createExpenseMutation.isPending ? 'Submitting...' : 'Submit Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}