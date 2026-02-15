import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceLineItemEditor({ items = [], onItemsChange, taxRate = 20, dayItems = {} }) {
  const { data: settings } = useQuery({
    queryKey: ['invoicingSettings'],
    queryFn: async () => {
      const results = await base44.entities.InvoicingSettings.list();
      return results?.[0];
    },
  });

  // Auto-populate items from dayItems
  useEffect(() => {
    const dayItemsArray = [];
    Object.values(dayItems).forEach(dayItemsList => {
      if (Array.isArray(dayItemsList)) {
        dayItemsList.forEach(item => {
          const section = item.type === 'client_call' ? 'Client Calls' : 
                         item.type === 'service' ? 'Services' : 'Extra Charges';
          
          // Check if this item already exists in items
          const exists = items.some(existingItem => existingItem.id === item.id);
          
          if (!exists) {
            dayItemsArray.push({
              ...item,
              section: section,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              tax_rate: taxRate,
              discount: 0
            });
          }
        });
      }
    });

    if (dayItemsArray.length > 0) {
      onItemsChange([...items, ...dayItemsArray]);
    }
  }, [dayItems]);

  const callTypes = settings?.call_types || ['Early Call', 'Morning Call', 'Lunch Call', 'Tea Call', 'Bed Call', 'Social Care Call'];

  const addItem = (section) => {
    const newItem = {
      id: Date.now(),
      section: section,
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: taxRate,
      discount: 0
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (id, field, value) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onItemsChange(updated);
  };

  const removeItem = (id) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const afterDiscount = subtotal - (item.discount || 0);
    const tax = (afterDiscount * (item.tax_rate || 0)) / 100;
    return afterDiscount + tax;
  };

  const sections = ['Services', 'Client Calls', 'Extra Charges'];
  
  const groupedItems = {};
  sections.forEach(section => {
    groupedItems[section] = items.filter(item => item.section === section);
  });

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">{section}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem(section)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Add {section.slice(0, -1)}
            </Button>
          </div>

          <div className="space-y-3">
            {groupedItems[section].map(item => (
              <div key={item.id} className="flex gap-3 items-end bg-slate-50 p-3 rounded">
                <div className="flex-1">
                   <label className="text-xs text-slate-500 block mb-1">Description</label>
                   {section === 'Client Calls' ? (
                     <Select value={item.description} onValueChange={(value) => updateItem(item.id, 'description', value)}>
                       <SelectTrigger className="h-8">
                         <SelectValue placeholder="Select call type" />
                       </SelectTrigger>
                       <SelectContent>
                         {callTypes.map(type => (
                           <SelectItem key={type} value={type}>{type}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   ) : (
                     <Input
                       value={item.description}
                       onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                       placeholder="E.g., Morning care visit"
                       className="h-8"
                     />
                   )}
                 </div>

                <div className="w-20">
                  <label className="text-xs text-slate-500 block mb-1">Qty</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="h-8"
                    min="0"
                  />
                </div>

                <div className="w-24">
                  <label className="text-xs text-slate-500 block mb-1">Unit Price</label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="h-8"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="w-20">
                  <label className="text-xs text-slate-500 block mb-1">Discount</label>
                  <Input
                    type="number"
                    value={item.discount}
                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                    className="h-8"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="w-20">
                  <label className="text-xs text-slate-500 block mb-1">Tax %</label>
                  <Input
                    type="number"
                    value={item.tax_rate}
                    onChange={(e) => updateItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                    className="h-8"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="w-24">
                  <label className="text-xs text-slate-500 block mb-1">Total</label>
                  <div className="h-8 flex items-center font-semibold text-sm">
                    £{calculateItemTotal(item).toFixed(2)}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {groupedItems[section].length === 0 && (
              <p className="text-sm text-slate-400 py-2">No {section.toLowerCase()} added yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}