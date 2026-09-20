import React from 'react';
import { Play, Layers, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onAssignTask: (agent: Agent) => void;
  onToggleSwarm: (agent: Agent) => void;
  onCustomize: (agent: Agent) => void;
  isInSwarm: boolean;
  language: 'roman-urdu' | 'urdu' | 'english';
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onAssignTask,
  onToggleSwarm,
  onCustomize,
  isInSwarm,
  language,
}) => {
  const promptToDisplay =
    language === 'roman-urdu' || language === 'urdu'
      ? agent.samplePromptUrdu
      : agent.samplePrompt;

  return (
    <div
      id={`agent-card-${agent.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      {/* Top row: ID, Domain, Status */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              #{agent.id}
            </span>
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
              {agent.domain}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                agent.status === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agent.status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {agent.status === 'ready'
                ? language === 'roman-urdu'
                  ? 'Active'
                  : 'Ready'
                : 'Standby'}
            </span>
            <span className="text-[10px] font-mono text-slate-500" title="Model Reliability Index">
              {agent.efficiencyScore}%
            </span>
          </div>
        </div>

        {/* Name & Specialization */}
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-1">
            {agent.name}
          </h3>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {agent.specialization}
          </p>
        </div>

        {/* Tags / Capabilities */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 3).map((cap, i) => (
            <span
              key={i}
              className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700/50"
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Sample Prompt Preview */}
        <div className="mt-3 rounded-lg bg-slate-950/70 p-2.5 border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-400 mb-1">
            <Sparkles className="h-3 w-3" />
            <span>
              {language === 'roman-urdu'
                ? 'Sample Task'
                : language === 'urdu'
                ? 'مثالی ٹاسک'
                : 'Sample Prompt'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed">
            "{promptToDisplay}"
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
        {/* Customize / Persona info button */}
        <button
          id={`btn-customize-${agent.id}`}
          onClick={() => onCustomize(agent)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors px-1.5 py-1 rounded hover:bg-slate-800"
          title="Inspect / Edit System Instructions"
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>Config</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Swarm toggle button */}
          <button
            id={`btn-swarm-${agent.id}`}
            onClick={() => onToggleSwarm(agent)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
              isInSwarm
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            title={isInSwarm ? 'Remove from Swarm' : 'Add to Multi-Agent Swarm'}
          >
            {isInSwarm ? (
              <>
                <Check className="h-3 w-3 text-cyan-400" />
                <span>In Swarm</span>
              </>
            ) : (
              <>
                <Layers className="h-3 w-3 text-slate-400" />
                <span>Swarm</span>
              </>
            )}
          </button>

          {/* Direct Run button */}
          <button
            id={`btn-run-${agent.id}`}
            onClick={() => onAssignTask(agent)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>
              {language === 'roman-urdu'
                ? 'Task Dein'
                : language === 'urdu'
                ? 'کام دیں'
                : 'Run Task'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
