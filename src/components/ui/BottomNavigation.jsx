import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Shield,
  Package,
  PoundSterling
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Chat', icon: MessageSquare, page: 'Chat' },
  { name: 'Profile', icon: User, page: 'Profile' },
];

export default function BottomNavigation({ currentPageName, unreadChatCount = 0, unreadAssetsCount = 0 }) {
  const navigate = useNavigate();
  return createPortal(
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[9999] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = currentPageName === item.page;
          const badgeCount = item.page === 'Chat' ? unreadChatCount : (item.page === 'Assets' ? unreadAssetsCount : 0);

          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-0 flex-1 transition-colors relative min-h-[48px]",
                isActive
                  ? "text-teal-600 border-t-2 border-teal-600"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                item.name === 'Assets' && "fill-orange-500",
                item.name === 'Chat' && "fill-green-600",
                item.name === 'Admin' && "fill-blue-600",
                item.name === 'Profile' && "fill-current"
              )} />
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}