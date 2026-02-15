import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Avatar from '@/components/ui/Avatar';
import PWAInstallButton from '@/components/PWAInstallButton';
import { Bell, Shield, HelpCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export default function HeaderIcons({ user, isAdmin, totalAdminTasks, unreadNotificationCount }) {
  return (
    <div className="z-40 bg-white/95 backdrop-blur-sm p-1 rounded-lg mb-1 hidden lg:flex items-center gap-1 border border-slate-200">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => window.history.back()}
        className="text-slate-600"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Admin Shield */}
      {isAdmin && (
        <Link to={createPageUrl('Admin')} className="relative cursor-pointer hover:opacity-75">
          <Shield className="w-6 h-6 text-blue-600 fill-blue-600" />
          {totalAdminTasks > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalAdminTasks}
            </span>
          )}
        </Link>
      )}

      {/* Notifications */}
      <Link to={createPageUrl('Messages')} className="relative cursor-pointer hover:opacity-75">
        <Bell className={cn("w-6 h-6 text-red-600 fill-red-600", unreadNotificationCount > 0 && "animate-pulse")} />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadNotificationCount}
          </span>
        )}
      </Link>

      {/* Help */}
      <Link to={createPageUrl('HowToUseApp')} className="cursor-pointer hover:opacity-75">
        <HelpCircle className="w-6 h-6 text-slate-600" />
      </Link>

      {/* User Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer hover:opacity-75 lg:ml-0 ml-auto">
            <Avatar name={user?.staff_full_name || user?.full_name} size="sm" src={user?.photo_url} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={createPageUrl('Settings')}>Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={createPageUrl('ApprovalsAndFinancials')}>Approvals & Financials</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={createPageUrl('HowToUseApp')} className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              How To Use The App
            </Link>
          </DropdownMenuItem>
          <PWAInstallButton />
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => base44.auth.logout()}
            className="text-red-600"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}