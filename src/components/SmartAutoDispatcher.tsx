import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  RotateCw,
  Layers,
  Bot,
  Play,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Agent } from '../types';
import { searchAgentFleet, DOMAINS } from '../data/agentFleet';

interface SmartAutoDispatcherProps {
  onClose: () => void;
  onSelectAgent: (agent: Agent) => void;
  onLaunchSwarm: (agents: Agent[], initialPrompt: string) => void;
  language: 'roman-urdu' | 'urdu' | 'english';
}

export const SmartAutoDispatcher: React.FC<SmartAutoDispatcherProps> = ({
  onClose,
  onSelectAgent,
  onLaunchSwarm,
  language,
}) => {
  const [taskQuery, setTaskQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchedAgents, setMatchedAgents] = useState<Agent[]>([]);
  const [rationale, setRationale] = useState<string | null>(null);

  // Quick suggestions in Roman Urdu & English
  const suggestions = [
    {
      label: 'Python Crypto Web Scraper',
      prompt: 'Mujhe ek Python web scraper aur automated price tracker bana ke do crypto ke liye.',
    },
    {
      label: 'Urdu Business Plan',
      prompt: 'Organic desi ghee aur honey brand ke liye ek complete Urdu business plan aur marketing strategy banao.',
    },
    {
      label: 'Full-Stack Bug Fix & Audit',
      prompt: 'Find potential security and performance bottlenecks in a high-traffic Node.js Express & React application.',
    },
    {
      label: 'Roman Urdu Customer Care Script',
      prompt: 'E-commerce return & refund ke liye professional Roman Urdu customer support script aur templates likho.',
    },
  ];

  const handleDispatch = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || taskQuery;
    if (!promptToUse.trim() || isMatching) return;

    setIsMatching(true);
    setMatchedAgents([]);
    setRationale(null);

    try {
      // First attempt server-side auto-match for deep analysis
      const res = await fetch('/api/agents/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskPrompt: promptToUse }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRationale(data.data.summary || 'Top specialized models dispatched for this request.');
          
          // Match agents from the recommended domains
          const matchedList: Agent[] = [];
          const recs = data.data.recommendations || [];
          
          for (const rec of recs) {
            const domainFound = DOMAINS.find(
              (d) => d.name.toLowerCase().includes(rec.domain.toLowerCase()) ||
                     rec.domain.toLowerCase().includes(d.name.toLowerCase())
            );
            const domainId = domainFound ? domainFound.id : undefined;
            const found = searchAgentFleet(rec.recommendedAgentRole || promptToUse, domainId, 1);
            if (found.length > 0 && !matchedList.some((a) => a.id === found[0].id)) {
              matchedList.push(found[0]);
            }
          }

          // If less than 3, backfill with keyword search from fleet
          if (matchedList.length < 3) {
            const fallback = searchAgentFleet(promptToUse, undefined, 3 - matchedList.length);
            for (const a of fallback) {
              if (!matchedList.some((m) => m.id === a.id)) {
                matchedList.push(a);
              }
            }
          }

          setMatchedAgents(matchedList);
          setIsMatching(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend auto-match fallback to local heuristic engine:', e);
    }

    // Local heuristic fallback across 2,000 agents
    const found = searchAgentFleet(promptToUse, undefined, 3);
    setMatchedAgents(found);
    setRationale(
      language === 'roman-urdu'
        ? `Aapki request ke mutabiq 2000 fleet se behtareen 3 models match kiye gaye hain.`
        : `Matched top 3 specialized models from the 2,000 fleet for your request.`
    );
    setIsMatching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-indigo-500/30 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {language === 'roman-urdu'
                  ? 'Smart AI Dispatcher (2000 Agent Matcher)'
                  : language === 'urdu'
                  ? 'سمارٹ اے آئی ڈسپیچر (۲۰۰۰ ماڈلز)'
                  : 'Smart AI Dispatcher (Fleet Mobilizer)'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'roman-urdu'
                  ? 'Jo bhi aap chahein yahan likhein, system 2000 agents mein se exact expert models mobilize karega.'
                  : 'Describe your requirements; the dispatcher mobilizes the ideal specialized models instantly.'}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Query input box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              {language === 'roman-urdu'
                ? 'Aapko kya karwana hai? (Urdu, Roman Urdu ya English mein likhein):'
                : 'What task or goal do you need solved? (Supports Roman Urdu, Urdu, or English):'}
            </label>

            <div className="relative">
              <textarea
                rows={3}
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder="Misal: Mujhe ek SaaS landing page ka high-converting Roman Urdu copy aur structure plan chahiye..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Quick suggestions pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500">Quick ideas:</span>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTaskQuery(item.prompt);
                    handleDispatch(item.prompt);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500/40 hover:text-indigo-200 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dispatch button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleDispatch()}
              disabled={isMatching || !taskQuery.trim()}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-md ${
                isMatching || !taskQuery.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-500/20'
              }`}
            >
              {isMatching ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Scanning 2,000 Agents...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Auto-Match Top Agents</span>
                </>
              )}
            </button>
          </div>

          {/* Rationale & Results */}
          {matchedAgents.length > 0 && (
            <div className="space-y-4 border-t border-slate-800/80 pt-4">
              {rationale && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-300 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                  <p>{rationale}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Mobilized Models (Top 3 Candidates)
                  </span>
                  <button
                    onClick={() => onLaunchSwarm(matchedAgents, taskQuery)}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Run All 3 as Swarm</span>
                  </button>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  {matchedAgents.map((agent, i) => (
                    <div
                      key={agent.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 hover:border-indigo-500/40 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono font-bold text-indigo-400">
                            #{agent.id}
                          </span>
                          <span className="text-slate-500">
                            Rank #{i + 1}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {agent.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {agent.specialization}
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectAgent(agent)}
                        className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-indigo-600/80 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 transition-colors"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Assign Task</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
