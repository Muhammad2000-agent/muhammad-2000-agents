import React, { useState } from 'react';
import {
  X,
  Layers,
  RotateCw,
  Play,
  CheckCircle2,
  Copy,
  Check,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Agent, SwarmPhase } from '../types';

interface SwarmModalProps {
  swarmAgents: Agent[];
  onRemoveAgent: (agentId: string) => void;
  onClearSwarm: () => void;
  onClose: () => void;
  initialPrompt?: string;
  language: 'roman-urdu' | 'urdu' | 'english';
}

export const SwarmModal: React.FC<SwarmModalProps> = ({
  swarmAgents,
  onRemoveAgent,
  onClearSwarm,
  onClose,
  initialPrompt = '',
  language,
}) => {
  const [taskPrompt, setTaskPrompt] = useState(initialPrompt);
  const [targetLanguage, setTargetLanguage] = useState<'auto' | 'roman-urdu' | 'urdu' | 'english'>('auto');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<SwarmPhase[]>([]);
  const [finalOutput, setFinalOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleRunSwarm = async () => {
    if (!taskPrompt.trim() || isRunning || swarmAgents.length === 0) return;

    setIsRunning(true);
    setError(null);
    setPhases([]);
    setFinalOutput('');

    try {
      const res = await fetch('/api/agents/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskPrompt,
          selectedAgents: swarmAgents,
          languagePreference: targetLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Swarm execution failed.');
      }

      setPhases(data.steps || []);
      setFinalOutput(data.finalOutput || '');
    } catch (err: any) {
      console.error('Swarm execution error:', err);
      setError(err.message || 'Swarm task failed to execute.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (!finalOutput) return;
    navigator.clipboard.writeText(finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Multi-Agent Swarm Collaboration
                </h2>
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                  {swarmAgents.length} Agents Selected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selected models collaborate sequentially: Planning &rarr; Implementation &rarr; Review & Final Polish.
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
          {/* Swarm roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Active Swarm Squad
              </span>
              {swarmAgents.length > 0 && (
                <button
                  onClick={onClearSwarm}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear all
                </button>
              )}
            </div>

            {swarmAgents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                Koi agent swarm mein shamil nahi. Niche catalog se kisi bhi agent card par "Swarm" button dabayein (kam az kam 1 se 3 agents).
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {swarmAgents.map((agent, idx) => (
                  <div
                    key={agent.id}
                    className="relative flex items-center justify-between rounded-xl border border-cyan-500/20 bg-slate-900/80 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-[11px]">
                        <span>Phase {idx + 1}:</span>
                        <span>#{agent.id}</span>
                      </div>
                      <p className="font-medium text-slate-200 truncate max-w-[160px]">
                        {agent.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {agent.domain}
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveAgent(agent.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Remove from swarm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prompt input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {language === 'roman-urdu'
                  ? 'Swarms ke liye Collective Goal / Mission:'
                  : 'Collective Mission Prompt for the Swarm:'}
              </label>

              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-0.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="auto">Auto Language</option>
                <option value="roman-urdu">Roman Urdu</option>
                <option value="urdu">Urdu</option>
                <option value="english">English</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Enter the complex goal you want this multi-agent team to collaborate on..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Run button */}
          <div className="flex justify-end">
            <button
              onClick={handleRunSwarm}
              disabled={isRunning || !taskPrompt.trim() || swarmAgents.length === 0}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-md ${
                isRunning || !taskPrompt.trim() || swarmAgents.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Swarm Collaborating in Real-time...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Launch Swarm Collaboration</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Execution steps visualization */}
          {phases.length > 0 && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Multi-Stage Agent Output Chain
              </span>

              <div className="space-y-3">
                {phases.map((phase, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                        <span className="font-semibold text-white">
                          Phase {idx + 1}: {phase.role}
                        </span>
                        <span className="font-mono text-cyan-300">
                          [{phase.agentName}]
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {phase.contribution}
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Synthesis */}
              {finalOutput && (
                <div className="mt-4 rounded-xl border border-cyan-500/30 bg-slate-900/90 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Final Synthesized Solution
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Final</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                    {finalOutput}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
