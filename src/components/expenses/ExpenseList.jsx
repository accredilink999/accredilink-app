import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function ExpenseList({ staffId, isAdmin }) {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', staffId, isAdmin],
    queryFn: async () => {
      if (staffId && !isAdmin) {
        return base44.entities.Expense.filter({ staff_id: staffId }, '-date', 100);
      }
      return base44.entities.Expense.list('-date', 200);
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: ({ id, user }) => base44.entities.Expense.update(id, {
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense approved');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Expense.update(id, {
      status: 'rejected',
      rejection_reason: reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense rejected');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const filteredExpenses = expenses.filter(exp => 
    filterStatus === 'all' || exp.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map((expense) => (
          <Card key={expense.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-slate-900 capitalize">
                    {expense.expense_type.replace(/_/g, ' ')}
                  </h4>
                  <Badge className={getStatusColor(expense.status)}>
                    {expense.status}
                  </Badge>
                </div>
                {isAdmin && <p className="text-sm text-slate-600 mb-1">{expense.staff_name}</p>}
                <p className="text-sm text-slate-500">{expense.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(parseISO(expense.expense_date || expense.date || expense.created_at), 'MMM d, yyyy')}
                </p>
                {expense.payment_due_date && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Payment due: {format(parseISO(expense.payment_due_date), 'MMM d, yyyy')}
                  </p>
                )}
                {expense.mileage_distance && (
                  <p className="text-xs text-slate-500 mt-1">
                    {expense.mileage_distance} miles @ £{expense.mileage_rate}/mile
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">£{expense.amount.toFixed(2)}</p>
                </div>
                {isAdmin && expense.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveExpenseMutation.mutate({ id: expense.id, user })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) rejectExpenseMutation.mutate({ id: expense.id, reason });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {expense.receipt_url && (
                  <Button size="sm" variant="outline" onClick={() => window.open(expense.receipt_url, '_blank')}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredExpenses.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No expenses found</p>
        </Card>
      )}
    </div>
  );
}