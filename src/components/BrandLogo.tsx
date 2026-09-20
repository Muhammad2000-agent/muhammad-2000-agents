import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    hero: 'h-16 w-16',
  }[size];

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    hero: 'text-2xl sm:text-3xl',
  }[size];

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.2',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-0.5',
    hero: 'text-xs px-3 py-1',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-Tech Vector Hexagonal Shield & Neural Monogram Logo */}
      <div className={`relative ${iconDimensions} shrink-0 group`}>
        {/* Ambient Glow Halo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />

        {/* SVG Cyber Emblem */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-full w-full drop-shadow-xl"
        >
          <defs>
            {/* Outer Hexagon Gradient */}
            <linearGradient id="logoHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Inner Core Gradient */}
            <linearGradient id="logoInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>

            {/* Neural Letter M Gradient */}
            <linearGradient id="logoMGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="50%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>

            {/* Quantum Glow Filter */}
            <filter id="quantumGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Precision Cyber Hexagonal Shield Frame */}
          <path
            d="M24 3L42 13.5V34.5L24 45L6 34.5V13.5L24 3Z"
            fill="url(#logoInnerGrad)"
            stroke="url(#logoHexGrad)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Internal Circuit Accent Lines */}
          <path
            d="M24 7L38 15V33L24 41L10 33V15L24 7Z"
            stroke="#10b981"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* High-Tech Neural "M" Core Geometry with Quantum Peak */}
          <path
            d="M15 32V17.5L24 25.5L33 17.5V32"
            stroke="url(#logoMGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#quantumGlow)"
          />

          {/* Central Quantum Node (Glowing Core) */}
          <circle cx="24" cy="25.5" r="2.2" fill="#34d399" />
          <circle cx="24" cy="25.5" r="4.2" stroke="#67e8f9" strokeOpacity="0.6" strokeWidth="0.8" />

          {/* Corner Orbit Nodes (2000 Fleet Micro Nodes) */}
          <circle cx="24" cy="4" r="1.5" fill="#34d399" />
          <circle cx="42" cy="14" r="1.2" fill="#06b6d4" />
          <circle cx="42" cy="34" r="1.2" fill="#6366f1" />
          <circle cx="24" cy="44" r="1.5" fill="#a855f7" />
          <circle cx="6" cy="34" r="1.2" fill="#6366f1" />
          <circle cx="6" cy="14" r="1.2" fill="#06b6d4" />
        </svg>
      </div>

      {/* Brand Typography & Tagline */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-tight text-white font-sans ${titleSizes}`}>
              Muhammad
            </span>
            <span
              className={`rounded-lg bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold tracking-wider shadow-sm ${badgeSizes}`}
            >
              2000 AI
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 tracking-wide flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Autonomous Project & Intelligence Studio
            </span>
          )}
        </div>
      )}
    </div>
  );
};
