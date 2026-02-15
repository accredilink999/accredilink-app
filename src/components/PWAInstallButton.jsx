import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA Install Prompt Ready');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      console.log('PWA Installation Initiated');
    } catch (err) {
      console.error('Install error:', err);
    }
  };

  // Only show if we have the prompt
  if (!deferredPrompt) {
    return null;
  }

  return (
    <DropdownMenuItem 
      onClick={handleInstall}
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Download App
    </DropdownMenuItem>
  );
}