import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function DraftRecoveryPrompt({ open, onRestore, onDiscard }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recover Saved Draft?</AlertDialogTitle>
          <AlertDialogDescription>
            You have a previously saved draft for this form. Would you like to restore it or start fresh?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Start Fresh</AlertDialogCancel>
          <AlertDialogAction onClick={onRestore} className="bg-teal-600 hover:bg-teal-700">
            Restore Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
