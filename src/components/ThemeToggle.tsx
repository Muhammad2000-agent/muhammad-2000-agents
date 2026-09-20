import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { mode, toggleMode } = useAppTheme();
  const isLight = mode === 'light';

  return (
    <button
      id="theme-toggle-button"
      type="button"
      onClick={toggleMode}
      className={`relative inline-flex items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none ${
        isLight
          ? 'border-amber-400/50 bg-amber-50 text-amber-900 hover:bg-amber-100/80 shadow-sm focus:ring-amber-500'
          : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white shadow-sm focus:ring-slate-500'
      } ${className}`}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to Dark Mode / ڈارک موڈ میں تبدیل کریں' : 'Switch to Light Mode / لائٹ موڈ میں تبدیل کریں'}
    >
      <div className="relative flex items-center justify-center w-4 h-4">
        {isLight ? (
          <Sun className="h-3.5 w-3.5 text-amber-500 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-indigo-300 transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>

      <span className="hidden sm:inline font-medium">
        {isLight ? 'Light' : 'Dark'}
      </span>

      {showLabel && (
        <span className="text-[10px] opacity-75">
          ({isLight ? 'لائٹ' : 'ڈارک'})
        </span>
      )}
    </button>
  );
};
