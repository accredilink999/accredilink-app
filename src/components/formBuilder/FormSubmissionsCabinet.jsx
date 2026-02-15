import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ChevronDown, Download, Plus, Folder, X, Edit2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const FormSubmissionsCabinet = forwardRef(function FormSubmissionsCabinet({ submissions, onView, onDelete, onMove, onUpdateCabinet, currentUser, forms = [] }, ref) {
  const queryClient = useQueryClient();
  
  const { data: cabinetStructures = [] } = useQuery({
    queryKey: ['cabinetStructures'],
    queryFn: () => base44.entities.CabinetStructure.list(),
  });

  const updateCabinetMutation = useMutation({
    mutationFn: ({ mainCabinetName, subCabinets }) => {
      const existing = cabinetStructures.find(c => c.main_cabinet_name === mainCabinetName);
      if (existing) {
        return base44.entities.CabinetStructure.update(existing.id, { sub_cabinets: subCabinets });
      } else {
        return base44.entities.CabinetStructure.create({ main_cabinet_name: mainCabinetName, sub_cabinets: subCabinets });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinetStructures'] });
    }
  });

  const deleteCabinetMutation = useMutation({
    mutationFn: (id) => base44.entities.CabinetStructure.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinetStructures'] });
    }
  });

  const getInitialCabinets = () => {
    const otherCabinets = cabinetStructures.filter(c => c.main_cabinet_name !== 'Care Logs');
    
    return otherCabinets.map(c => ({
      id: `cabinet-${c.main_cabinet_name}`,
      name: c.main_cabinet_name,
      isOpen: false,
      subCabinets: c.sub_cabinets || [],
      newSubName: '',
      showNewInput: false
    }));
  };

  const [cabinets, setCabinets] = useState(() => getInitialCabinets());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubCabinet, setExpandedSubCabinet] = useState(null);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [showNewCabinetInput, setShowNewCabinetInput] = useState(false);
  const [renamingCabinet, setRenamingCabinet] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const getSubCabinetsForMainCabinet = (mainCabinetName) => {
    const cabinet = cabinets.find(c => c.name === mainCabinetName);
    const subCabinetsFromStructure = cabinet?.subCabinets || [];
    
    // Add "General" if there are any submissions in it
    const submissionCabinets = [...new Set(submissions
      .filter(s => s.main_cabinet === mainCabinetName)
      .map(s => s.cabinet || 'General'))];
    
    return [...new Set([...subCabinetsFromStructure, ...submissionCabinets])].sort();
  };

  const filteredSubmissions = (mainCabinetName, subCabinetName) => {
    return submissions
      .filter(s => s.main_cabinet === mainCabinetName || (s.main_cabinet !== 'Care Logs' && s.cabinet || 'General') === subCabinetName)
      .filter(submission =>
        submission.form_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.submitter_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const handleDownload = async (submission, form) => {
    const data = JSON.parse(submission.submission_data || '{}');
    const fields = JSON.parse(form.schema || '[]');
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const maxWidth = 180;
      const lineHeight = 7;

      // Fetch user company data for header
      const userCompanyData = await base44.auth.me();
      const hasCompanyHeader = fields.some(f => f.type === 'company-header');
      
      // Add company header if form has company-header field
      if (hasCompanyHeader && userCompanyData) {
        // Company header background
        doc.setFillColor(29, 78, 137); // Blue-600
        doc.rect(0, 0, 210, 35, 'F');

        // Add logo image if available
        if (userCompanyData.company_logo_url) {
          try {
            doc.addImage(userCompanyData.company_logo_url, 'PNG', margin, yPosition + 2, 20, 20);
          } catch (err) {
            console.error('Error adding logo to PDF:', err);
          }
        }

        // Company name
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(userCompanyData.company_name || 'Company Name', margin + 25, yPosition + 10);

        // Company contact
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(219, 234, 254); // Blue-100
        doc.text(userCompanyData.company_contact_number || 'Contact Number', margin + 25, yPosition + 18);

        yPosition = 45;
      } else {
        // Add header background
        doc.setFillColor(51, 65, 85); // Slate color
        doc.rect(0, 0, 210, 35, 'F');

        // Title
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(form.title, margin, yPosition + 12);
        yPosition = 40;
      }

      doc.setTextColor(0, 0, 0);
      
      // Add form title if we showed company header instead
      if (hasCompanyHeader && userCompanyData) {
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(form.title, margin, yPosition);
        yPosition += 8;
      }

      // Submission metadata section
       doc.setFontSize(9);
       doc.setFont(undefined, 'bold');
       doc.setTextColor(51, 65, 85);
       doc.text('SUBMISSION DETAILS', margin, yPosition);
      yPosition += 6;
      
      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, 195, yPosition);
      yPosition += 5;
      
      // Metadata
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Submitted by: ${submission.submitter_email}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Date: ${new Date(submission.created_date).toLocaleDateString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Time: ${new Date(submission.created_date).toLocaleTimeString()}`, margin, yPosition);
      yPosition += 10;
      
      doc.setTextColor(0, 0, 0);
      
      // Form responses section
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('FORM RESPONSES', margin, yPosition);
      yPosition += 6;
      
      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, 195, yPosition);
      yPosition += 8;
      
      // Fields
      fields.forEach((field, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
          
          // Add page header on new pages
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(150, 150, 150);
          doc.text(`${form.title} - Page ${doc.getNumberOfPages()}`, margin, margin - 5);
          yPosition = margin + 5;
        }
        
        // Field label (sub-header style)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const labelText = `${index + 1}. ${field.label}${field.required ? ' *' : ''}`;
        doc.text(labelText, margin, yPosition);
        yPosition += 6;
        
        // Field value
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const fieldValue = data[field.id] ? String(data[field.id]) : '[No response provided]';
        const splitText = doc.splitTextToSize(fieldValue, maxWidth);
        doc.text(splitText, margin + 3, yPosition);
        yPosition += (splitText.length * lineHeight) + 8;
      });
      
      // Footer
      yPosition = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition);
      doc.text(`Page ${doc.getNumberOfPages()}`, 195, yPosition, { align: 'right' });
      
      doc.save(`${submission.form_title}-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleCreateCabinet = () => {
    if (newCabinetName.trim()) {
      const newCabinet = {
        id: `cabinet-${Date.now()}`,
        name: newCabinetName.trim(),
        isOpen: true,
        subCabinets: [],
        newSubName: '',
        showNewInput: false
      };
      setCabinets([...cabinets, newCabinet]);
      updateCabinetMutation.mutate({ mainCabinetName: newCabinetName.trim(), subCabinets: [] });
      setShowNewCabinetInput(false);
      setNewCabinetName('');
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.job_title === 'admin' || currentUser?.job_title === 'manager';

  const handleDeleteMainCabinet = (cabinetId) => {
    if (!isAdmin) return;
    const cabinet = cabinets.find(c => c.id === cabinetId);
    if (window.confirm(`Delete "${cabinet.name}" filing cabinet?`)) {
      setCabinets(cabinets.filter(c => c.id !== cabinetId));
      const structure = cabinetStructures.find(c => c.main_cabinet_name === cabinet.name);
      if (structure) {
        deleteCabinetMutation.mutate(structure.id);
      }
    }
  };

  const handleDeleteSubCabinet = (mainCabinetName, subCabinetName) => {
    if (!isAdmin) return;
    if (window.confirm(`Delete "${subCabinetName}" cabinet? Submissions will be moved to General.`)) {
      const cabinetSubmissions = submissions.filter(s => 
        s.main_cabinet === mainCabinetName && (s.cabinet || 'General') === subCabinetName
      );
      cabinetSubmissions.forEach(submission => {
        onUpdateCabinet(submission.id, 'General');
      });
      const updatedCabinets = cabinets.map(c => 
        c.name === mainCabinetName 
          ? { ...c, subCabinets: c.subCabinets.filter(sc => sc !== subCabinetName) }
          : c
      );
      const cabinet = updatedCabinets.find(c => c.name === mainCabinetName);
      if (cabinet) {
        updateCabinetMutation.mutate({ mainCabinetName, subCabinets: cabinet.subCabinets }, {
          onSuccess: () => {
            setCabinets(updatedCabinets);
            setExpandedSubCabinet(null);
          }
        });
      }
    }
  };

  const handleRenameMainCabinet = (cabinetId, newName) => {
    if (!isAdmin || !newName.trim()) {
      setRenamingCabinet(null);
      setRenameValue('');
      return;
    }
    const cabinet = cabinets.find(c => c.id === cabinetId);
    if (newName === cabinet.name) {
      setRenamingCabinet(null);
      return;
    }
    const updatedCabinets = cabinets.map(c => 
      c.id === cabinetId ? { ...c, name: newName.trim() } : c
    );
    setCabinets(updatedCabinets);
    const oldStructure = cabinetStructures.find(c => c.main_cabinet_name === cabinet.name);
    if (oldStructure) {
      deleteCabinetMutation.mutate(oldStructure.id);
    }
    updateCabinetMutation.mutate({ mainCabinetName: newName.trim(), subCabinets: cabinet.subCabinets });
    setRenamingCabinet(null);
    setRenameValue('');
  };

  const handleRenameSubCabinet = (mainCabinetName, oldName, newName) => {
    if (!isAdmin || !newName.trim() || newName === oldName) {
      setRenamingCabinet(null);
      setRenameValue('');
      return;
    }
    const cabinetSubmissions = submissions.filter(s => 
      s.main_cabinet === mainCabinetName && (s.cabinet || 'General') === oldName
    );
    cabinetSubmissions.forEach(submission => {
      onUpdateCabinet(submission.id, newName.trim());
    });
    const updatedCabinets = cabinets.map(c => 
      c.name === mainCabinetName 
        ? { ...c, subCabinets: c.subCabinets.map(sc => sc === oldName ? newName.trim() : sc) }
        : c
    );
    setCabinets(updatedCabinets);
    const cabinet = updatedCabinets.find(c => c.name === mainCabinetName);
    if (cabinet) {
      updateCabinetMutation.mutate({ mainCabinetName, subCabinets: cabinet.subCabinets });
    }
    setRenamingCabinet(null);
    setRenameValue('');
  };

  useEffect(() => {
    if (cabinetStructures.length > 0) {
      setCabinets(getInitialCabinets());
    }
  }, [cabinetStructures]);

  useImperativeHandle(ref, () => ({
    createNewCabinet: () => {
      setShowNewCabinetInput(true);
    }
  }));

  const renderMainCabinet = (cabinet) => {
    const subCabinets = getSubCabinetsForMainCabinet(cabinet.name);
    const totalSubmissions = submissions.filter(s => s.main_cabinet === cabinet.name).length;

    return (
      <div key={cabinet.id} className="relative">
        <div 
          onClick={() => setCabinets(cabinets.map(c => c.id === cabinet.id ? { ...c, isOpen: !c.isOpen } : c))}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl px-8 py-6 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-5xl">📋</div>
              <div>
                {renamingCabinet === cabinet.id ? (
                  <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleRenameMainCabinet(cabinet.id, renameValue);
                      }}
                      autoFocus
                      className="h-8 text-sm text-slate-900"
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameMainCabinet(cabinet.id, renameValue);
                      }}
                      className="bg-white text-blue-600 hover:bg-gray-100 h-8"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingCabinet(null);
                        setRenameValue('');
                      }}
                      className="bg-blue-500 text-white border-blue-500 hover:bg-blue-400 h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{cabinet.name}</h2>
                      {isAdmin && cabinet.id !== 'care-logs' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingCabinet(cabinet.id);
                              setRenameValue(cabinet.name);
                            }}
                            className="p-1 text-white hover:bg-blue-500 rounded-lg transition-colors"
                            title="Rename cabinet"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMainCabinet(cabinet.id);
                            }}
                            className="p-1 text-red-300 hover:bg-red-500 rounded-lg transition-colors"
                            title="Delete cabinet"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-blue-100 text-sm mt-1">{totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''} across {subCabinets.length} cabinet{subCabinets.length !== 1 ? 's' : ''}</p>
                  </>
                )}
              </div>
            </div>
            <ChevronDown 
              className={cn(
                "w-6 h-6 text-white transition-transform flex-shrink-0",
                cabinet.isOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        {cabinet.isOpen && (
          <>
            {/* Search Box */}
            <div className="bg-white border-x border-slate-200 px-8 py-4 space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search submissions..."
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
              
              {/* Add Sub-Cabinet Button */}
              <div className="flex gap-2">
                {!cabinet.showNewInput ? (
                  <Button
                    onClick={() => setCabinets(cabinets.map(c => c.id === cabinet.id ? { ...c, showNewInput: true } : c))}
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Sub-Cabinet
                  </Button>
                ) : (
                  <div className="flex gap-2 flex-1">
                    <Input
                      type="text"
                      placeholder="Sub-cabinet name..."
                      value={cabinet.newSubName}
                      onChange={(e) => setCabinets(cabinets.map(c => c.id === cabinet.id ? { ...c, newSubName: e.target.value } : c))}
                      onKeyPress={(e) => {
                       if (e.key === 'Enter' && cabinet.newSubName.trim()) {
                         const updatedCabinets = cabinets.map(c => c.id === cabinet.id 
                           ? { ...c, subCabinets: [...c.subCabinets, cabinet.newSubName.trim()], newSubName: '', showNewInput: false }
                           : c
                         );
                         setCabinets(updatedCabinets);
                         const updated = updatedCabinets.find(c => c.id === cabinet.id);
                         updateCabinetMutation.mutate({ mainCabinetName: cabinet.name, subCabinets: updated.subCabinets });
                       }
                      }}
                      autoFocus
                      className="pl-4"
                    />
                    <Button
                      onClick={() => {
                        if (cabinet.newSubName.trim()) {
                          const updatedCabinets = cabinets.map(c => c.id === cabinet.id 
                            ? { ...c, subCabinets: [...c.subCabinets, cabinet.newSubName.trim()], newSubName: '', showNewInput: false }
                            : c
                          );
                          setCabinets(updatedCabinets);
                          const updated = updatedCabinets.find(c => c.id === cabinet.id);
                          updateCabinetMutation.mutate({ mainCabinetName: cabinet.name, subCabinets: updated.subCabinets });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create
                    </Button>
                    <Button
                      onClick={() => setCabinets(cabinets.map(c => c.id === cabinet.id ? { ...c, showNewInput: false, newSubName: '' } : c))}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Cabinets List */}
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl divide-y max-h-[700px] overflow-y-auto">
              {subCabinets.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <p className="text-slate-500">No submissions yet</p>
                </div>
              ) : (
                subCabinets.map((subCabinetName) => {
                  const cabinetSubmissions = filteredSubmissions(cabinet.name, subCabinetName);
                  const isExpanded = expandedSubCabinet === `${cabinet.id}-${subCabinetName}`;

                  return (
                    <div key={subCabinetName} className="border-b last:border-b-0">
                      <div
                        onClick={() => setExpandedSubCabinet(isExpanded ? null : `${cabinet.id}-${subCabinetName}`)}
                        className="px-8 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4 group bg-slate-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          {renamingCabinet === `${cabinet.id}-${subCabinetName}` ? (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') handleRenameSubCabinet(cabinet.name, subCabinetName, renameValue);
                                }}
                                autoFocus
                                className="h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameSubCabinet(cabinet.name, subCabinetName, renameValue);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 h-8"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingCabinet(null);
                                  setRenameValue('');
                                }}
                                className="h-8"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {subCabinetName}
                              </h3>
                              <span className="text-sm text-slate-500">
                                ({cabinetSubmissions.length})
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && subCabinetName !== 'General' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingCabinet(`${cabinet.id}-${subCabinetName}`);
                                  setRenameValue(subCabinetName);
                                }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Rename cabinet"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubCabinet(cabinet.name, subCabinetName);
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete cabinet"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-slate-400 transition-transform flex-shrink-0",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="divide-y bg-white">
                          {cabinetSubmissions.length === 0 ? (
                            <div className="px-8 py-6 text-center text-slate-500 text-sm">
                              {searchQuery ? 'No submissions match your search' : 'No submissions in this cabinet'}
                            </div>
                          ) : (
                            cabinetSubmissions.map((submission) => (
                              <div key={submission.id} className="px-8 py-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">
                                      {submission.form_title}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                      {submission.submitter_email} • {new Date(submission.created_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onView(submission)}
                                      className="text-slate-600 hover:text-blue-600"
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => {
                                         const form = forms.find(f => f.id === submission.form_id);
                                         if (form) {
                                           handleDownload(submission, form);
                                         }
                                       }}
                                       className="text-slate-600 hover:text-green-600"
                                       title="Download as PDF"
                                     >
                                       <Download className="w-4 h-4" />
                                     </Button>
                                    
                                    <div className="relative group">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-600 hover:text-slate-900"
                                        title="Move"
                                      >
                                        <Folder className="w-4 h-4" />
                                      </Button>
                                      <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                                        {subCabinets
                                          .filter(c => c !== subCabinetName)
                                          .map(targetCabinet => (
                                            <button
                                              key={targetCabinet}
                                              onClick={() => onUpdateCabinet(submission.id, targetCabinet)}
                                              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg whitespace-nowrap"
                                            >
                                              Move to {targetCabinet}
                                            </button>
                                          ))}
                                      </div>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDelete(submission)}
                                      className="text-slate-600 hover:text-red-600"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Filing Cabinet UI */}
      {showNewCabinetInput && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-4">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="New filing cabinet name..."
              value={newCabinetName}
              onChange={(e) => setNewCabinetName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateCabinet()}
              autoFocus
              className="pl-4"
            />
            <Button
              onClick={handleCreateCabinet}
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              Create
            </Button>
            <Button
              onClick={() => {
                setShowNewCabinetInput(false);
                setNewCabinetName('');
              }}
              variant="outline"
              className="flex-shrink-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Filing Cabinets */}
      {cabinets.map(cabinet => renderMainCabinet(cabinet))}
    </div>
  );
});

FormSubmissionsCabinet.displayName = 'FormSubmissionsCabinet';

export default FormSubmissionsCabinet;