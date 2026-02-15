import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';

export default function EventForm({ isOpen, onClose, onSubmit, event, staffList, isLoading }) {
  const [formData, setFormData] = useState(event || {
    title: '',
    description: '',
    type: 'meeting',
    start_date: '',
    end_date: '',
    location: '',
    assigned_to: [],
    is_all_day: false,
    color_code: '#3b82f6'
  });

  const handleToggleStaff = (staffId) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(staffId)
        ? prev.assigned_to.filter(id => id !== staffId)
        : [...prev.assigned_to, staffId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Event title"
                required
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Event details"
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location/Link</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Physical location or meeting link"
              />
            </div>

            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={formData.color_code}
                onChange={(e) => setFormData({...formData, color_code: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Assign to Staff</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3 bg-slate-50">
              {staffList.map(staff => (
                <label key={staff.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assigned_to.includes(staff.id)}
                    onChange={() => handleToggleStaff(staff.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{staff.full_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {event?.id ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}