import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, RotateCcw, Trash2, Eye, Archive as ArchiveIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO } from 'date-fns';

export default function Archive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewingItem, setViewingItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const queryClient = useQueryClient();

  const { data: archivedItems = [] } = useQuery({
    queryKey: ['archive'],
    queryFn: () => base44.entities.Archive.list('-created_date', 500),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const restoreMutation = useMutation({
    mutationFn: async (archiveItem) => {
      try {
        const itemData = JSON.parse(archiveItem.item_data);
        
        // Restore based on item type
        switch(archiveItem.item_type) {
          case 'document':
            await base44.entities.Document.create(itemData);
            break;
          case 'staff':
            // Note: Users can't be created via SDK, would need manual re-invite
            throw new Error('Staff members must be re-invited through the user management system');
          case 'rota':
            await ShiftApi.create(itemData);
            break;
          case 'client':
            await base44.entities.ServiceUser.create(itemData);
            break;
          case 'incident':
            await base44.entities.Incident.create(itemData);
            break;
          case 'training':
            await base44.entities.Training.create(itemData);
            break;
          case 'leave_request':
            await base44.entities.LeaveRequest.create(itemData);
            break;
          case 'message':
            await base44.entities.Message.create(itemData);
            break;
          default:
            throw new Error('Unknown item type');
        }
        
        // Mark as restored in archive
        await base44.entities.Archive.update(archiveItem.id, {
          is_restored: true,
          restored_at: new Date().toISOString()
        });

        queryClient.invalidateQueries({ queryKey: ['archive'] });
        return true;
      } catch (error) {
        throw error;
      }
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (archiveItemId) => {
      return await base44.entities.Archive.delete(archiveItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
    },
  });

  const filteredItems = archivedItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.item_type === selectedType;
    const notRestored = !item.is_restored;
    return matchesSearch && matchesType && notRestored;
  });

  const getTypeColor = (type) => {
    const colors = {
      document: 'bg-blue-100 text-blue-700',
      staff: 'bg-purple-100 text-purple-700',
      rota: 'bg-orange-100 text-orange-700',
      client: 'bg-green-100 text-green-700',
      incident: 'bg-red-100 text-red-700',
      training: 'bg-cyan-100 text-cyan-700',
      leave_request: 'bg-amber-100 text-amber-700',
      message: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  const itemTypes = ['all', 'document', 'staff', 'rota', 'client', 'incident', 'training', 'leave_request', 'message'];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Archive"
        subtitle="Recover deleted items. Permanently deleted items cannot be recovered."
        icon={ArchiveIcon}
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Search</label>
            <Input
              placeholder="Search archived items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Type</label>
            <div className="flex flex-wrap gap-2">
              {itemTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={selectedType === type ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  {type === 'all' ? 'All Items' : type.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="restored">Restored ({archivedItems.filter(i => i.is_restored).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No archived items found</p>
              <p className="text-slate-400 text-sm mt-1">Deleted items will appear here for recovery</p>
            </Card>
          ) : (
            filteredItems.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(item.item_type)}>
                        {item.item_type.replace(/_/g, ' ')}
                      </Badge>
                      {item.is_restored && (
                        <Badge className="bg-green-100 text-green-700">Restored</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.item_name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="text-slate-500">Deleted by:</span> {item.deleted_by_name || 'Unknown'}
                      </div>
                      <div>
                        <span className="text-slate-500">Deleted:</span> {format(parseISO(item.deleted_at), 'dd MMM yyyy HH:mm')}
                      </div>
                    </div>
                    {item.reason && (
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="text-slate-500">Reason:</span> {item.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-col">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingItem(item)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{item.item_name}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-auto">
                          <pre className="bg-slate-50 p-4 rounded text-xs text-slate-700 whitespace-pre-wrap break-words">
                            {JSON.stringify(JSON.parse(item.item_data), null, 2)}
                          </pre>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      onClick={() => restoreMutation.mutate(item)}
                      disabled={restoreMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingAction(() => () => permanentDeleteMutation.mutate(item.id));
                        setConfirmOpen(true);
                      }}
                      disabled={permanentDeleteMutation.isPending}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="restored" className="space-y-4">
          {archivedItems.filter(i => i.is_restored).length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No restored items yet</p>
            </Card>
          ) : (
            archivedItems
              .filter(i => i.is_restored)
              .map(item => (
                <Card key={item.id} className="p-4 opacity-75">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeColor(item.item_type)}>
                          {item.item_type.replace(/_/g, ' ')}
                        </Badge>
                        <Badge className="bg-green-100 text-green-700">Restored</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{item.item_name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="text-slate-500">Restored:</span> {format(parseISO(item.restored_at), 'dd MMM yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Permanently delete?"
        description="Are you sure? This will permanently delete this item and it cannot be recovered."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => pendingAction?.()}
      />
    </div>
  );
}