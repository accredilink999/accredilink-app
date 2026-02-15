import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function OnboardingModal({ user, open }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        full_name: fullName.trim(),
        staff_full_name: fullName.trim(),
        phone: phone,
        onboarding_complete: true
      });
      // Wait a bit for the backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.refetchQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fullName.trim()) {
      updateProfileMutation.mutate();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Welcome to Accredi-Care</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Complete your profile to get started</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="fullName">Staff Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your staff name"
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={!fullName.trim() || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}