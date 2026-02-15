import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ChevronDown, Plus, Folder, X, Edit2, Send } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function FormsCabinet({ forms, onEdit, onPreview, onDelete, onSubCabinetsChange, onSubmit }) {
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFormId, setExpandedFormId] = useState(null);
  const [subCabinets, setSubCabinets] = useState([]);
  const [newSubName, setNewSubName] = useState('');
  const [showNewSubInput, setShowNewSubInput] = useState(false);
  const [renamingSubId, setRenamingSubId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filing Cabinet Header - Clickable */}
      <div className="relative">
        <div 
          onClick={() => setIsCabinetOpen(!isCabinetOpen)}
          className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-t-2xl px-8 py-6 cursor-pointer hover:from-amber-700 hover:to-amber-800 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-5xl">🗄️</div>
              <div>
                <h2 className="text-2xl font-bold text-white">Blank Deployable Forms</h2>
                <p className="text-amber-100 text-sm mt-1">{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <ChevronDown 
              className={cn(
                "w-6 h-6 text-white transition-transform flex-shrink-0",
                isCabinetOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Expanded Cabinet Contents */}
        {isCabinetOpen && (
          <>
            {/* Search Box */}
             <div className="bg-white border-x border-slate-200 px-8 py-4 space-y-3">
               <div className="relative">
                 <Input
                   type="text"
                   placeholder="Search forms..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-4"
                 />
                 {searchQuery && (
                   <button
                     onClick={() => setSearchQuery('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                   >
                     ✕
                   </button>
                 )}
               </div>

               {/* New Sub-Cabinet Section */}
               {!showNewSubInput ? (
                 <Button
                   onClick={() => setShowNewSubInput(true)}
                   variant="outline"
                   className="text-amber-600 border-amber-200 hover:bg-amber-50 w-full"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   New Sub-Cabinet
                 </Button>
               ) : (
                 <div className="flex gap-2">
                   <Input
                     type="text"
                     placeholder="Sub-cabinet name..."
                     value={newSubName}
                     onChange={(e) => setNewSubName(e.target.value)}
                     onKeyPress={(e) => {
                       if (e.key === 'Enter' && newSubName.trim()) {
                         setSubCabinets([...subCabinets, { id: Date.now(), name: newSubName.trim() }]);
                         setNewSubName('');
                         setShowNewSubInput(false);
                       }
                     }}
                     autoFocus
                     className="pl-4"
                   />
                   <Button
                     onClick={() => {
                       if (newSubName.trim()) {
                         const newSub = { id: Date.now(), name: newSubName.trim() };
                         setSubCabinets([...subCabinets, newSub]);
                         onSubCabinetsChange?.([...subCabinets, newSub]);
                         setNewSubName('');
                         setShowNewSubInput(false);
                       }
                     }}
                     className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                   >
                     Create
                   </Button>
                   <Button
                     onClick={() => {
                       setShowNewSubInput(false);
                       setNewSubName('');
                     }}
                     variant="outline"
                     className="flex-shrink-0"
                   >
                     Cancel
                   </Button>
                 </div>
               )}

               {/* Sub-Cabinets List */}
               {subCabinets.length > 0 && (
                 <div className="space-y-2 pt-2">
                   <p className="text-xs font-semibold text-slate-500">SUB-CABINETS</p>
                   {subCabinets.map((sub) => (
                     <div key={sub.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                       {renamingSubId === sub.id ? (
                         <div className="flex gap-1 flex-1">
                           <Input
                             type="text"
                             value={renameValue}
                             onChange={(e) => setRenameValue(e.target.value)}
                             onKeyPress={(e) => {
                               if (e.key === 'Enter') {
                                 const updated = subCabinets.map(s => s.id === sub.id ? { ...s, name: renameValue } : s);
                                 setSubCabinets(updated);
                                 onSubCabinetsChange?.(updated);
                                 setRenamingSubId(null);
                               }
                             }}
                             autoFocus
                             className="h-7 text-sm"
                           />
                           <Button
                             size="sm"
                             onClick={() => {
                               const updated = subCabinets.map(s => s.id === sub.id ? { ...s, name: renameValue } : s);
                               setSubCabinets(updated);
                               onSubCabinetsChange?.(updated);
                               setRenamingSubId(null);
                             }}
                             className="bg-amber-600 hover:bg-amber-700 h-7 px-2"
                           >
                             Save
                           </Button>
                         </div>
                       ) : (
                         <>
                           <div className="flex items-center gap-2 flex-1 min-w-0">
                             <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                             <span className="text-sm text-slate-700 truncate">{sub.name}</span>
                           </div>
                           <div className="flex gap-1">
                             <button
                               onClick={() => {
                                 setRenamingSubId(sub.id);
                                 setRenameValue(sub.name);
                               }}
                               className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                               title="Rename"
                             >
                               <Edit2 className="w-3 h-3" />
                             </button>
                             <button
                               onClick={() => {
                                 const updated = subCabinets.filter(s => s.id !== sub.id);
                                 setSubCabinets(updated);
                                 onSubCabinetsChange?.(updated);
                               }}
                               className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                               title="Delete"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                         </>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </div>

            {/* Forms List */}
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl divide-y max-h-[600px] overflow-y-auto">
          {filteredForms.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-slate-500">
                {searchQuery ? 'No forms match your search' : 'No forms created yet'}
              </p>
            </div>
          ) : (
            filteredForms.map((form) => {
              const isExpanded = expandedFormId === form.id;
              return (
                <div key={form.id} className="border-b last:border-b-0">
                  <div
                    onClick={() => setExpandedFormId(isExpanded ? null : form.id)}
                    className="px-8 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-slate-400 transition-transform flex-shrink-0",
                          isExpanded && "rotate-180"
                        )}
                      />
                      <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                        {form.title}
                      </h3>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-8 py-4 bg-slate-50 border-t space-y-4">
                      {form.description && (
                        <p className="text-sm text-slate-600">{form.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Created {new Date(form.created_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>
                          {JSON.parse(form.schema || '[]').length} field{
                            JSON.parse(form.schema || '[]').length !== 1 ? 's' : ''
                          }
                        </span>
                        {form.submission_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{form.submission_count} submission{form.submission_count !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={() => onEdit(form)}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-sm"
                        >
                          Edit Form
                        </Button>
                        <Button
                          onClick={() => onSubmit?.(form)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm"
                          title="Make Live Submission"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Live Submission
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onPreview(form)}
                          className="text-slate-600 hover:text-teal-600"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(form)}
                          className="text-slate-600 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
          </>
          )}
          </div>
          </div>
          );
          }