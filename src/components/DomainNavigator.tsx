import React from 'react';
import {
  Code2,
  Database,
  Languages,
  PenTool,
  GraduationCap,
  TrendingUp,
  Briefcase,
  ShieldAlert,
  Server,
  Layout,
  Megaphone,
  Headphones,
  Scale,
  ShoppingBag,
  HeartPulse,
  CheckSquare,
  Film,
  Users,
  Binary,
  Cpu,
} from 'lucide-react';
import { DOMAINS } from '../data/agentFleet';

interface DomainNavigatorProps {
  selectedDomainId: string;
  onSelectDomain: (domainId: string) => void;
  language: 'roman-urdu' | 'urdu' | 'english';
}

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  Database,
  Languages,
  PenTool,
  GraduationCap,
  TrendingUp,
  Briefcase,
  ShieldAlert,
  Server,
  Layout,
  Megaphone,
  Headphones,
  Scale,
  ShoppingBag,
  HeartPulse,
  CheckSquare,
  Film,
  Users,
  Binary,
  Cpu,
};

export const DomainNavigator: React.FC<DomainNavigatorProps> = ({
  selectedDomainId,
  onSelectDomain,
  language,
}) => {
  return (
    <div className="w-full border-b border-slate-800/80 bg-slate-950/60 pb-3 pt-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {language === 'roman-urdu'
                ? '20 Specialized Domains (100 Agents Har Domain Mein)'
                : language === 'urdu'
                ? '۲۰ خصوصی ڈومینز (ہر ڈومین میں ۱۰۰ ایجنٹس = ۲۰۰۰ کل)'
                : '20 Specialized Domains (100 Agents Per Domain = 2,000 Total)'}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Click any domain to focus or pick 'All 2000'
          </span>
        </div>

        {/* Scrollable domain pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* All 2000 Agents button */}
          <button
            id="domain-filter-all"
            onClick={() => onSelectDomain('all')}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              selectedDomainId === 'all'
                ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200 shadow-sm shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              {language === 'roman-urdu'
                ? 'All 2000 Agents'
                : language === 'urdu'
                ? 'تمام ۲۰۰۰ ایجنٹس'
                : 'All 2000 Agents'}
            </span>
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300">
              2,000
            </span>
          </button>

          {DOMAINS.map((domain) => {
            const Icon = ICON_MAP[domain.icon] || Cpu;
            const isSelected = selectedDomainId === domain.id;

            return (
              <button
                key={domain.id}
                id={`domain-filter-${domain.id}`}
                onClick={() => onSelectDomain(domain.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
                title={domain.description}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{language === 'urdu' ? domain.urduName : domain.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                  {domain.agentCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
