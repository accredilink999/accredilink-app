import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AlertCircle, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ClientRotaSetup({ serviceUser, isOpen, onClose, onComplete }) {
  const [recurrence, setRecurrence] = useState('month');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = React.useState([]);

  React.useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      const teamsData = await base44.entities.CareTeam.list();
      setTeams(teamsData);
      if (teamsData.length > 0) {
        setTeamId(teamsData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const handleSetupRota = async () => {
    if (!serviceUser?.call_times?.length) return;

    setLoading(true);
    try {
      // Create ClientCall entities for each scheduled call time
      const today = new Date().toISOString().split('T')[0];
      let callsCreated = 0;

      for (const callTime of serviceUser.call_times) {
        // Create calls based on recurrence setting
        const datesToCreate = getDateRangeForRecurrence(today, recurrence);
        
        for (const date of datesToCreate) {
          try {
            await base44.entities.ClientCall.create({
              service_user_id: serviceUser.id,
              service_user_name: serviceUser.full_name,
              service_user_address: serviceUser.address,
              date: date,
              scheduled_time: callTime.time,
              duration_minutes: parseInt(callTime.duration) || 30,
              notes: callTime.notes || '',
              status: 'pending',
            });
            callsCreated++;
          } catch (error) {
            console.error('Failed to create client call:', error);
          }
        }
      }

      console.log(`Successfully created ${callsCreated} client calls`);
      onComplete?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to create calls:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeForRecurrence = (startDate, recurrence) => {
    const dates = [];
    const start = new Date(startDate);
    let end = new Date(start);

    switch (recurrence) {
      case 'day':
        dates.push(startDate);
        break;
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
      case 'month':
        for (let i = 0; i < 30; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
      case 'year':
        for (let i = 0; i < 365; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
      case 'ongoing':
        // Create 365 days by default for ongoing
        for (let i = 0; i < 365; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
      default:
        dates.push(startDate);
    }

    return dates;
  };

  const handleSkip = () => {
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Add {serviceUser?.full_name} to Rota
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
           {serviceUser?.call_times && serviceUser.call_times.length > 0 ? (
             <Card className="p-4 bg-blue-50 border-blue-200">
               <p className="text-sm text-blue-900 font-medium mb-2">Call Schedule Found:</p>
               <div className="space-y-1">
                 {serviceUser.call_times.map((call, idx) => (
                   <div key={idx} className="text-sm text-blue-800">
                     • {call.time} - {call.duration}min ({call.type})
                   </div>
                 ))}
               </div>
             </Card>
           ) : (
             <Card className="p-4 bg-amber-50 border-amber-200 flex gap-2">
               <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
               <p className="text-sm text-amber-900">No call times defined. You can add them manually to the rota.</p>
             </Card>
           )}

          <div>
            <label className="text-sm font-medium text-slate-900 block mb-2">Repeat Schedule</label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily (1 Day)</SelectItem>
                <SelectItem value="week">Weekly (7 Days)</SelectItem>
                <SelectItem value="month">Monthly (30 Days)</SelectItem>
                <SelectItem value="year">Yearly (365 Days)</SelectItem>
                <SelectItem value="ongoing">Ongoing (Until Cancelled)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-2">
              {recurrence === 'day' && 'Creates calls for today'}
              {recurrence === 'week' && 'Creates calls for the next 7 days'}
              {recurrence === 'month' && 'Creates calls for the next 30 days'}
              {recurrence === 'year' && 'Creates calls for the next 365 days'}
              {recurrence === 'ongoing' && 'Creates calls indefinitely until you cancel'}
            </p>
          </div>
        </div>

        <DialogFooter>
           <Button variant="outline" onClick={handleSkip} disabled={loading}>
             Skip for Now
           </Button>
           <Button
             onClick={handleSetupRota}
             disabled={!serviceUser?.call_times?.length || loading}
             className="bg-blue-600 hover:bg-blue-700"
           >
             {loading ? 'Creating calls...' : 'Add Calls to Rota'}
           </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}