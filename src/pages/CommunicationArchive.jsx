import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from '@/components/ui/PageHeader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Search, MessageSquare, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function CommunicationArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: archivedMessages = [] } = useQuery({
    queryKey: ['archivedCommunication'],
    queryFn: async () => {
      const archived = await base44.entities.Archive.list('-deleted_at', 100);
      return archived.filter(item => 
        (item.item_type === 'message' || item.item_type === 'announcement') && !item.is_restored
      );
    },
  });

  const { data: restoredMessages = [] } = useQuery({
    queryKey: ['restoredCommunication'],
    queryFn: async () => {
      const archived = await base44.entities.Archive.list('-restored_at', 100);
      return archived.filter(item => 
        (item.item_type === 'message' || item.item_type === 'announcement') && item.is_restored
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (archiveItem) => {
      const messageData = JSON.parse(archiveItem.item_data);
      await base44.entities.Message.create(messageData);
      await base44.entities.Archive.update(archiveItem.id, { is_restored: true, restored_at: new Date().toISOString() });
      return archiveItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivedCommunication'] });
      queryClient.invalidateQueries({ queryKey: ['restoredCommunication'] });
      setSelectedItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (archiveItem) => base44.entities.Archive.delete(archiveItem.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivedCommunication'] });
      queryClient.invalidateQueries({ queryKey: ['restoredCommunication'] });
      setSelectedItem(null);
    },
  });

  const filteredActive = archivedMessages.filter(item =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_data?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRestored = restoredMessages.filter(item =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_data?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type) => {
    return type === 'announcement' ? 
      <Bell className="w-4 h-4" /> : 
      <MessageSquare className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    return type === 'announcement' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const MessageCard = ({ item, isRestored }) => (
    <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedItem(item)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(item.item_type)}
          <Badge className={getTypeColor(item.item_type)}>
            {item.item_type === 'announcement' ? 'Announcement' : 'Message'}
          </Badge>
          {isRestored && <Badge variant="outline">Restored</Badge>}
        </div>
        <span className="text-xs text-slate-500">
          {format(parseISO(isRestored ? item.restored_at : item.deleted_at), 'MMM d, yyyy HH:mm')}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{item.item_name}</h3>
      <p className="text-sm text-slate-600 line-clamp-2">
        {JSON.parse(item.item_data)?.content || JSON.parse(item.item_data)?.title || 'No content'}
      </p>
      <div className="mt-3 flex gap-2">
        {!isRestored && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              restoreMutation.mutate(item);
            }}
            className="gap-1"
            disabled={restoreMutation.isPending}
          >
            <RotateCcw className="w-3 h-3" />
            Restore
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            deleteMutation.mutate(item);
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Communication Archive" 
        subtitle="Manage deleted alerts and messages"
      />

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search archived messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">
            Deleted ({filteredActive.length})
          </TabsTrigger>
          <TabsTrigger value="restored">
            Restored ({filteredRestored.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {filteredActive.length === 0 ? (
            <Card className="p-12 text-center bg-white border-0 shadow-sm">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">No deleted messages or announcements</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredActive.map((item) => (
                <MessageCard key={item.id} item={item} isRestored={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="restored" className="mt-6">
          {filteredRestored.length === 0 ? (
            <Card className="p-12 text-center bg-white border-0 shadow-sm">
              <RotateCcw className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">No restored messages or announcements</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRestored.map((item) => (
                <MessageCard key={item.id} item={item} isRestored={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedItem && (
        <Card className="p-6 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-3">{selectedItem.item_name}</h3>
          <div className="bg-white p-4 rounded border border-blue-100 mb-4">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(JSON.parse(selectedItem.item_data), null, 2)}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}