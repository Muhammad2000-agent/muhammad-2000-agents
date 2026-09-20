import React, { useState } from 'react';
import { X, SlidersHorizontal, Check, Save, Bot, Sparkles } from 'lucide-react';
import { Agent } from '../types';

interface AgentCustomizerModalProps {
  agent: Agent;
  onClose: () => void;
  onSaveCustomPrompt: (agentId: string, updatedPrompt: string) => void;
  language: 'roman-urdu' | 'urdu' | 'english';
}

export const AgentCustomizerModal: React.FC<AgentCustomizerModalProps> = ({
  agent,
  onClose,
  onSaveCustomPrompt,
  language,
}) => {
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveCustomPrompt(agent.id, systemPrompt);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  #{agent.id}
                </span>
                <h2 className="text-base font-bold text-white">
                  {agent.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Persona Configuration & System Directives
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-300">
            {language === 'roman-urdu'
              ? 'Aap is model ke behavior, rules aur instructions ko apni marzi ke mutabiq customize kar sakte hain taake yeh theek aapki zarurat ke mutabiq behave kare.'
              : 'Tune this agent’s exact instructions, persona, and output constraints to match your custom business or technical needs.'}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>System Prompt & Directives:</span>
            </label>
            <textarea
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs sm:text-sm text-slate-100 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Domain: {agent.domain} | ID: {agent.id}
            </span>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Persona</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
