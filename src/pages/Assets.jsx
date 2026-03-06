import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import {
  Package,
  Plus,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  Image as ImageIcon,
  Edit,
  Trash2,
  Briefcase,
  MessageCircle,
  GraduationCap,
  AlertTriangle,
  Folder,
  Users,
  LayoutList,
  Wallet
} from 'lucide-react';
import { cn } from "@/lib/utils";

const categoryIcons = {
  equipment: '🔧',
  vehicle: '🚗',
  property: '🏢',
  technology: '💻',
  furniture: '🪑',
  other: '📦'
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800'
};

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'equipment',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    current_value: '',
    location: '',
    status: 'active',
    warranty_expiry: '',
    notes: '',
    photo_url: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
    initialData: [],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  usePullToRefresh(refetch);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  React.useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = base44.entities.Asset.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    });
    return unsubscribe;
  }, [user?.id, queryClient]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'equipment',
      serial_number: '',
      purchase_date: '',
      purchase_price: '',
      current_value: '',
      location: '',
      status: 'active',
      warranty_expiry: '',
      notes: '',
      photo_url: ''
    });
    setEditingAsset(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    if (submitData.purchase_price) submitData.purchase_price = parseFloat(submitData.purchase_price);
    if (submitData.current_value) submitData.current_value = parseFloat(submitData.current_value);
    
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name || '',
      description: asset.description || '',
      category: asset.category || 'equipment',
      serial_number: asset.serial_number || '',
      purchase_date: asset.purchase_date || '',
      purchase_price: asset.purchase_price || '',
      current_value: asset.current_value || '',
      location: asset.location || '',
      status: asset.status || 'active',
      warranty_expiry: asset.warranty_expiry || '',
      notes: asset.notes || '',
      photo_url: asset.photo_url || ''
    });
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 fill-orange-500 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { to: 'Incidents', label: 'Incidents', icon: AlertTriangle, bg: 'from-red-400 to-red-600', desc: 'Incidents & reporting' },
          { to: 'ClientManagement', label: 'Citizens', icon: Users, bg: 'from-orange-400 to-orange-600', desc: 'Supported citizens' },
          { to: 'Rota', label: 'Rotas', icon: LayoutList, bg: 'from-indigo-400 to-indigo-600', desc: 'Rotas & shifts' },
          { to: 'Chat', label: 'Chat', icon: MessageCircle, bg: 'from-green-400 to-green-600', desc: 'Private & team chat' },
          { to: 'ApprovalsAndFinancials', label: 'Approvals', icon: Wallet, bg: 'from-amber-400 to-amber-600', desc: 'Approvals & financials' },
          { to: 'Training', label: 'Training', icon: GraduationCap, bg: 'from-purple-400 to-purple-600', desc: 'Training & CPD' },
          { to: 'Documents', label: 'Documents', icon: Folder, bg: 'from-blue-400 to-blue-600', desc: 'My docs & compliance' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link
              key={section.to}
              to={createPageUrl(section.to)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
                {section.label}
              </span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">
                {section.desc}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Assets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-20">
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[asset.category]}</span>
                  <div>
                    <CardTitle className="text-base">{asset.name}</CardTitle>
                    <p className="text-xs text-slate-500 capitalize">{asset.category}</p>
                  </div>
                </div>
                <Badge className={statusColors[asset.status]}>
                  {asset.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.photo_url && (
                <img 
                  src={asset.photo_url} 
                  alt={asset.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              
              {asset.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{asset.description}</p>
              )}
              
              {asset.serial_number && (
                <div className="text-xs text-slate-500">
                  S/N: {asset.serial_number}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t">
                {asset.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {asset.location}
                  </div>
                )}
                
                {asset.assigned_to_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    {asset.assigned_to_name}
                  </div>
                )}
                
                {asset.current_value && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    £{asset.current_value.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(asset)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingAction(() => () => deleteMutation.mutate(asset.id));
                    setConfirmOpen(true);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>



      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this asset?"
        description="This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => pendingAction?.()}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (£)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value (£)</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office, Warehouse, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Asset Photo</Label>
              <div className="flex gap-2">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
                {formData.photo_url && (
                  <img src={formData.photo_url} alt="Preview" className="w-12 h-12 object-cover rounded" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingAsset ? 'Update Asset' : 'Add Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}