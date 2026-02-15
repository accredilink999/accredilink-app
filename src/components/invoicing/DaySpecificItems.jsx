import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DaySpecificItems({ repeatingDays, dayItems, onDayItemsChange, callTypes, hoursOptions = [], hourlyRates = [], taxRate = 20 }) {
  const [expandedDays, setExpandedDays] = useState({});
  const [addingType, setAddingType] = useState({});
  const [tempValues, setTempValues] = useState({});

  const toggleDayExpanded = (dayIdx) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIdx]: !prev[dayIdx]
    }));
  };

  const addItemToDay = (dayIdx, itemType) => {
    const newItems = { ...dayItems };
    if (!newItems[dayIdx]) {
      newItems[dayIdx] = [];
    }
    
    const newItem = {
      id: Date.now(),
      type: itemType,
      description: '',
      quantity: 1,
      unit_price: 0,
      double_handed: false
    };
    
    newItems[dayIdx].push(newItem);
    onDayItemsChange(newItems);
    setAddingType(prev => ({ ...prev, [dayIdx]: null }));
  };

  const updateDayItem = (dayIdx, itemId, field, value) => {
    const newItems = { ...dayItems };
    const item = newItems[dayIdx].find(i => i.id === itemId);
    if (item) {
      item[field] = value;
      onDayItemsChange(newItems);
    }
  };

  const removeDayItem = (dayIdx, itemId) => {
    const newItems = { ...dayItems };
    newItems[dayIdx] = newItems[dayIdx].filter(i => i.id !== itemId);
    if (newItems[dayIdx].length === 0) {
      delete newItems[dayIdx];
    }
    onDayItemsChange(newItems);
  };

  const repeatToAllDays = (sourceDayIdx) => {
    const sourceItems = dayItems[sourceDayIdx];
    if (!sourceItems || sourceItems.length === 0) return;
    
    const newItems = { ...dayItems };
    repeatingDays.forEach(dayIdx => {
      if (dayIdx !== sourceDayIdx) {
        newItems[dayIdx] = sourceItems.map(item => ({
          ...item,
          id: Date.now() + Math.random()
        }));
      }
    });
    onDayItemsChange(newItems);
  };

  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const afterDiscount = subtotal - (item.discount || 0);
    const tax = (afterDiscount * (item.tax_rate || taxRate)) / 100;
    return afterDiscount + tax;
  };

  const getItemTypeColor = (type) => {
    if (type === 'service') return 'bg-blue-50 border-blue-200';
    if (type === 'client_call') return 'bg-green-50 border-green-200';
    return 'bg-slate-50 border-slate-200';
  };

  const sortedDays = [...repeatingDays].sort((a, b) => a - b);
  const firstDay = sortedDays[0];

  const calculateGrandTotal = () => {
    let total = 0;
    sortedDays.forEach(dayIdx => {
      if (dayItems[dayIdx]) {
        total += dayItems[dayIdx].reduce((sum, item) => {
          return sum + (((item.quantity || 0) * (item.unit_price || 0)) * (item.double_handed ? 2 : 1));
        }, 0);
      }
    });
    return total;
  };

  return (
    <div className="space-y-3">
      {sortedDays.map((dayIdx, index) => (
        <Card key={dayIdx} className={getItemTypeColor(null)}>
          <CardHeader className="pb-3">
            <button
              onClick={() => toggleDayExpanded(dayIdx)}
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{dayNames[dayIdx]}</CardTitle>
                {index === 0 && dayItems[dayIdx]?.length > 0 && repeatingDays.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      repeatToAllDays(dayIdx);
                    }}
                    className="text-xs h-6 px-2 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                  >
                    Repeat to All Days
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">
                  {dayItems[dayIdx]?.length || 0} items
                </span>
                {expandedDays[dayIdx] ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          </CardHeader>

          {expandedDays[dayIdx] && (
            <CardContent className="space-y-4">
              {/* Existing Items */}
              {dayItems[dayIdx]?.map(item => (
                <div key={item.id} className={`p-3 rounded-lg border ${getItemTypeColor(item.type)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-slate-600 uppercase">
                      {item.type === 'client_call' ? 'Client Call' : 'Service'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDayItem(dayIdx, item.id)}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                  {item.type === 'client_call' ? (
                   <Select value={item.description || ''} onValueChange={(value) => updateDayItem(dayIdx, item.id, 'description', value)}>
                     <SelectTrigger className="text-sm">
                       <SelectValue placeholder="Select call type..." />
                     </SelectTrigger>
                     <SelectContent>
                       {callTypes && callTypes.length > 0 ? (
                         callTypes.map(callType => (
                           <SelectItem key={callType} value={callType}>
                             {callType}
                           </SelectItem>
                         ))
                       ) : (
                         <SelectItem value="no-options" disabled>No call types configured</SelectItem>
                       )}
                     </SelectContent>
                   </Select>
                  ) : (
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateDayItem(dayIdx, item.id, 'description', e.target.value)}
                      className="text-sm"
                    />
                  )}
                     <div className="grid grid-cols-3 gap-2">
                       <div>
                         <label className="text-xs text-slate-500 block mb-1">Hours</label>
                         <Select value={String(item.quantity || 1)} onValueChange={(value) => updateDayItem(dayIdx, item.id, 'quantity', parseFloat(value) || 1)}>
                           <SelectTrigger className="text-sm">
                             <SelectValue placeholder="Select hours..." />
                           </SelectTrigger>
                           <SelectContent>
                             {hoursOptions && hoursOptions.length > 0 ? (
                               hoursOptions.map(hours => (
                                 <SelectItem key={hours} value={String(hours)}>
                                   {hours}h
                                 </SelectItem>
                               ))
                             ) : (
                               <SelectItem value="no-options" disabled>No hours configured</SelectItem>
                             )}
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <label className="text-xs text-slate-500 block mb-1">Rate/Hour</label>
                         <Select value={String(item.unit_price)} onValueChange={(value) => updateDayItem(dayIdx, item.id, 'unit_price', parseFloat(value) || 0)}>
                           <SelectTrigger className="text-sm">
                             <SelectValue placeholder="Select rate..." />
                           </SelectTrigger>
                           <SelectContent>
                             {hourlyRates && hourlyRates.length > 0 ? (
                               hourlyRates.map(rate => (
                                 <SelectItem key={rate} value={String(rate)}>
                                   £{rate}/h
                                 </SelectItem>
                               ))
                             ) : (
                               <SelectItem value="no-options" disabled>No rates configured</SelectItem>
                             )}
                           </SelectContent>
                         </Select>
                         {item.type === 'client_call' && item.unit_price > 0 && (
                          <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                              type="checkbox"
                              checked={item.double_handed || false}
                              onChange={(e) => updateDayItem(dayIdx, item.id, 'double_handed', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs text-slate-700 font-medium">Double Handed</span>
                          </label>
                         )}
                       </div>
                       <div>
                         <label className="text-xs text-slate-500 block mb-1">Sub Total</label>
                         <div className="text-sm font-semibold text-teal-700 bg-teal-50 rounded px-3 py-2 border border-teal-200">
                           £{(((item.quantity || 0) * (item.unit_price || 0)) * (item.double_handed ? 2 : 1)).toFixed(2)}
                         </div>
                       </div>
                       </div>
                       </div>
                       </div>
               ))}

              {/* Add Item Button */}
              {!addingType[dayIdx] ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingType(prev => ({ ...prev, [dayIdx]: true }))}
                  className="w-full text-teal-600 border-teal-200 hover:bg-teal-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              ) : (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => addItemToDay(dayIdx, 'service')}
                      className="bg-blue-600 hover:bg-blue-700 text-xs"
                    >
                      Service
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addItemToDay(dayIdx, 'client_call')}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      Call
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingType(prev => ({ ...prev, [dayIdx]: null }))}
                    className="w-full text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Day Total */}
              {dayItems[dayIdx]?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Day Total:</span>
                  <span className="text-lg font-bold text-teal-700">
                    £{dayItems[dayIdx].reduce((sum, item) => sum + (((item.quantity || 0) * (item.unit_price || 0)) * (item.double_handed ? 2 : 1)), 0).toFixed(2)}
                  </span>
                </div>
              )}
              </CardContent>
          )}
        </Card>
      ))}
      
      {/* Grand Total */}
      {sortedDays.some(dayIdx => dayItems[dayIdx]?.length > 0) && (
        <Card className="bg-teal-50 border-teal-200 border-2">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">Grand Total (All Days):</span>
              <span className="text-2xl font-bold text-teal-700">
                £{calculateGrandTotal().toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}