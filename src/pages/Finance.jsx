import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Receipt, PoundSterling } from 'lucide-react';

export default function Finance() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const cards = [
    {
      to: 'Invoicing',
      label: 'Invoicing',
      icon: Receipt,
      bg: 'from-teal-500 to-teal-700',
      desc: 'Client invoices & payments',
    },
    ...(isSuperAdmin ? [{
      to: 'Payroll',
      label: 'Payroll',
      icon: PoundSterling,
      bg: 'from-emerald-500 to-emerald-700',
      desc: 'Pay runs, payslips & P60s',
    }] : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-400 mt-0.5">Invoicing and payroll</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ to, label, icon: Icon, bg, desc, badge }) => (
          <Link
            key={to}
            to={createPageUrl(to)}
            className="relative flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 active:scale-95"
          >
            {badge > 0 && (
              <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
            </div>
            <p className="text-base font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
