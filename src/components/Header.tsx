import React, { useState } from 'react';
import { Bot, Sparkles, Layers, History, LayoutGrid, MessageSquareCode, Palette, Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAppTheme, THEMES, AppTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeLanguage: 'roman-urdu' | 'urdu' | 'english';
  onLanguageChange: (lang: 'roman-urdu' | 'urdu' | 'english') => void;
  activeTab: 'chat' | 'workspace' | 'directory';
  onTabChange: (tab: 'chat' | 'workspace' | 'directory') => void;
  swarmCount: number;
  onOpenSwarm: () => void;
  onOpenAutoMatch: () => void;
  tasksCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  swarmCount,
  onOpenSwarm,
  onOpenAutoMatch,
  tasksCount,
  onOpenHistory,
}) => {
  const { currentTheme, themeConfig, setTheme, mode } = useAppTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const isLight = mode === 'light';

  return (
    <header className={`sticky top-0 z-30 border-b ${themeConfig.borderClass} ${isLight ? 'bg-white/95 text-slate-800 shadow-sm' : 'bg-slate-950/90 text-slate-100'} backdrop-blur-md transition-colors duration-300`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" showText={true} />
        </div>

        {/* Center: Main View Tabs */}
        <div className={`flex items-center rounded-xl border p-1 text-xs shadow-inner ${isLight ? 'border-slate-200 bg-slate-100/90' : 'border-slate-800 bg-slate-900/90'}`}>
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium transition-all ${
              activeTab === 'chat'
                ? themeConfig.activeTabClass
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Chat & Studio</span>
          </button>
          <button
            onClick={() => onTabChange('workspace')}
            className={`flex items-center gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 font-medium transition-all ${
              activeTab === 'workspace'
                ? themeConfig.activeTabClass
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tasks (Direct ZIP)</span>
          </button>
          <button
            onClick={() => onTabChange('directory')}
            className={`flex items-center gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 font-medium transition-all ${
              activeTab === 'directory'
                ? themeConfig.activeTabClass
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>2,000 Fleet</span>
          </button>
        </div>

        {/* Right: Actions, Theme, Swarm & Language */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Theme Selector Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`flex items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all shadow-sm ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800'
              }`}
              title="Change Theme Palette / رنگین تھیم تبدیل کریں"
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: themeConfig.primaryColor }}
              />
              <Palette className={`h-3.5 w-3.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`} />
              <span className="hidden lg:inline">{themeConfig.name}</span>
            </button>

            {/* Theme Dropdown Menu */}
            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div className={`absolute right-0 mt-2 z-50 w-52 rounded-xl border p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-800 shadow-slate-300/50'
                    : 'border-slate-700 bg-slate-950 text-slate-100'
                }`}>
                  <div className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b mb-1 ${
                    isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'
                  }`}>
                    Select App Theme (تھیم)
                  </div>
                  {Object.values(THEMES).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        currentTheme === t.id
                          ? isLight ? 'bg-slate-100 text-slate-950 font-semibold' : 'bg-slate-800/90 text-white font-semibold'
                          : isLight ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/20"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                        <div className="flex flex-col">
                          <span className="leading-tight">{t.name}</span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t.nameUrdu}</span>
                        </div>
                      </div>
                      {currentTheme === t.id && (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Smart Auto Match */}
          <button
            onClick={onOpenAutoMatch}
            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
            title="Auto-Match Agents for any task"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Auto-Match</span>
          </button>

          {/* Swarm Launch */}
          {swarmCount > 0 && (
            <button
              onClick={onOpenSwarm}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/20 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-all animate-pulse"
              title="Launch Swarm Collaboration"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Swarm ({swarmCount})</span>
            </button>
          )}

          {/* Task History */}
          {tasksCount > 0 && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-all"
              title="Task History"
            >
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">{tasksCount}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs">
            <button
              onClick={() => onLanguageChange('roman-urdu')}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                activeLanguage === 'roman-urdu'
                  ? 'bg-slate-700 font-medium text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Roman Urdu"
            >
              Roman Urdu
            </button>
            <button
              onClick={() => onLanguageChange('urdu')}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                activeLanguage === 'urdu'
                  ? 'bg-slate-700 font-medium text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Urdu"
            >
              اردو
            </button>
            <button
              onClick={() => onLanguageChange('english')}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                activeLanguage === 'english'
                  ? 'bg-slate-700 font-medium text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


