import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { invokeFunction } from '@/api/functions';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Avatar from '@/components/ui/Avatar';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  Calendar, Clock, Users, Video, FileText, Download, Loader2, Sparkles
} from 'lucide-react';

export default function PastMeetingDetail({ meeting, participants = [], open, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [localTranscript, setLocalTranscript] = useState(meeting?.transcript_text || '');
  const [localMinutes, setLocalMinutes] = useState(meeting?.minutes_text || '');
  const queryClient = useQueryClient();

  const scheduledAt = meeting?.scheduled_at ? parseISO(meeting.scheduled_at) : new Date();

  const handleGenerateTranscript = async () => {
    setGenerating(true);
    try {
      const result = await invokeFunction('generateMeetingTranscript', {
        meeting_id: meeting.id,
        generate_minutes: true,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.transcript) {
        setLocalTranscript(result.transcript);
        toast.success('Transcript generated');
      }
      if (result.minutes) {
        setLocalMinutes(result.minutes);
        toast.success('Meeting minutes generated');
      }

      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    } catch (err) {
      console.error('Transcript generation error:', err);
      toast.error('Failed to generate transcript');
    } finally {
      setGenerating(false);
    }
  };

  const downloadAsText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose?.()}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            {meeting?.title}
          </DialogTitle>
        </DialogHeader>

        {/* Meeting info */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(scheduledAt, 'EEE, d MMM yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(scheduledAt, 'HH:mm')} ({meeting?.duration_minutes || 60} min)
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Agenda */}
        {meeting?.agenda && (
          <Card className="p-3 mb-4 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Agenda</h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{meeting.agenda}</p>
          </Card>
        )}

        {/* Participants */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Participants</h4>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                <Avatar name={p.user_name} size="xs" />
                <span className="text-sm text-slate-700">{p.user_name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {p.role === 'organizer' ? 'Organiser' : p.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="recording" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recording">Recording</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="minutes">Minutes</TabsTrigger>
          </TabsList>

          {/* Recording tab */}
          <TabsContent value="recording" className="mt-3">
            {meeting?.recording_url ? (
              <div>
                <video
                  src={meeting.recording_url}
                  controls
                  className="w-full rounded-lg bg-black"
                  style={{ maxHeight: '400px' }}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(meeting.recording_url, '_blank')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download Recording
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Video className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recording available</p>
                <p className="text-xs mt-1">Enable recording when starting the meeting to capture it</p>
              </div>
            )}
          </TabsContent>

          {/* Transcript tab */}
          <TabsContent value="transcript" className="mt-3">
            {localTranscript ? (
              <div>
                <Card className="p-4 bg-slate-50 max-h-64 overflow-y-auto">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{localTranscript}</p>
                </Card>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAsText(localTranscript, `${meeting.title}-transcript.md`)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download Transcript
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400 mb-3">No transcript yet</p>
                {(meeting?.recording_url || meeting?.recording_id) && (
                  <Button
                    onClick={handleGenerateTranscript}
                    disabled={generating}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Generate Transcript</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Minutes tab */}
          <TabsContent value="minutes" className="mt-3">
            {localMinutes ? (
              <div>
                <Card className="p-4 bg-slate-50 max-h-64 overflow-y-auto prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{localMinutes}</ReactMarkdown>
                </Card>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAsText(localMinutes, `${meeting.title}-minutes.md`)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download Minutes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400 mb-3">No meeting minutes yet</p>
                {localTranscript ? (
                  <Button
                    onClick={handleGenerateTranscript}
                    disabled={generating}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Generate Meeting Minutes</>
                    )}
                  </Button>
                ) : (
                  <p className="text-xs text-slate-400">Generate a transcript first</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
