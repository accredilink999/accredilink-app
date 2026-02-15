import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Eye, Zap, Trash2 } from 'lucide-react';

export default function FormBuilderSettings({
  selectedFieldId,
  onDeleteField,
  onPreview,
  onDeploy,
  disabled
}) {
  const selectedField = selectedFieldId !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-white"
          disabled={disabled}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Form
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onDeploy}>
          <Zap className="w-4 h-4 mr-2" />
          Deploy & File
        </DropdownMenuItem>
        
        {selectedField && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteField(selectedFieldId)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Field
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}