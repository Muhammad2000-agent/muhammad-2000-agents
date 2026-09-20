import React, { useState } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  Bot,
  Layers,
  Terminal,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Agent, TaskExecution } from '../types';

interface TaskExecutionModalProps {
  agent: Agent;
  onClose: () => void;
  onTaskCompleted: (task: TaskExecution) => void;
  language: 'roman-urdu' | 'urdu' | 'english';
}

export const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({
  agent,
  onClose,
  onTaskCompleted,
  language,
}) => {
  const [prompt, setPrompt] = useState(
    language === 'roman-urdu' || language === 'urdu'
      ? agent.samplePromptUrdu
      : agent.samplePrompt
  );
  const [targetLanguage, setTargetLanguage] = useState<'auto' | 'roman-urdu' | 'urdu' | 'english'>('auto');
  const [executionMode, setExecutionMode] = useState<'comprehensive' | 'concise' | 'creative'>('comprehensive');
  const [temperature, setTemperature] = useState<number>(0.7);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleExecute = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setOutput('');
    const startTime = performance.now();

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          domain: agent.domain,
          systemPrompt: agent.systemPrompt,
          taskPrompt: prompt,
          languagePreference: targetLanguage,
          temperature,
          executionMode,
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTimeMs(elapsed);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error occurred while executing task.');
      }

      setOutput(data.output);

      const taskRecord: TaskExecution = {
        id: `task-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        domain: agent.domain,
        taskPrompt: prompt,
        languagePreference: targetLanguage,
        status: 'completed',
        output: data.output,
        durationMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        mode: 'single',
      };

      onTaskCompleted(taskRecord);
    } catch (err: any) {
      console.error('Task execution error:', err);
      setError(err.message || 'Failed to complete task.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="h-5 w-5" />
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
                {agent.domain} &bull; {agent.specialization}
              </p>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick presets row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Output Zaban:</span>
              <select
                id="target-language-select"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="auto">Auto (Match Prompt Language)</option>
                <option value="roman-urdu">Roman Urdu (اردو ان انگلش)</option>
                <option value="urdu">Urdu Nastaliq (اردو رسم الخط)</option>
                <option value="english">Professional English</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Style Mode:</span>
              <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                {(['comprehensive', 'concise', 'creative'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setExecutionMode(m)}
                    className={`rounded px-2 py-0.5 capitalize transition-colors ${
                      executionMode === m
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Temp:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-20 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-slate-400 w-6 text-right">
                {temperature}
              </span>
            </div>
          </div>

          {/* Prompt input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="agent-task-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                <span>
                  {language === 'roman-urdu'
                    ? 'Apna Task ya Instruction Yahan Likhein:'
                    : language === 'urdu'
                    ? 'اپنا ٹاسک یا ہدایات یہاں درج کریں:'
                    : 'Task Prompt / Instruction for this Agent:'}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrompt(agent.samplePromptUrdu)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  Load Roman Urdu Prompt
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setPrompt(agent.samplePrompt)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  Load English Prompt
                </button>
              </div>
            </div>

            <textarea
              id="agent-task-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                language === 'roman-urdu'
                  ? 'Misal: Mujhe is topic par ek detailed guide bna kar do, code aur real examples ke sath...'
                  : 'Describe your exact task or instructions for this AI agent...'
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Model: Gemini 3.8 Flash (Server Active)</span>
            </div>

            <button
              id="execute-agent-btn"
              onClick={handleExecute}
              disabled={isLoading || !prompt.trim()}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-md ${
                isLoading || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-600/30'
              }`}
            >
              {isLoading ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>
                    {language === 'roman-urdu'
                      ? 'Task Perform Ho Raha Hai...'
                      : language === 'urdu'
                      ? 'کام مکمل ہو رہا ہے...'
                      : 'Executing Agent Task...'}
                  </span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {language === 'roman-urdu'
                      ? 'Task Execute Karein'
                      : language === 'urdu'
                      ? 'ٹاسک شروع کریں'
                      : 'Execute Agent Task'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold">Execution Error:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Output Display Area */}
          {output && (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Agent Output Deliverable
                  </span>
                  {executionTimeMs !== null && (
                    <span className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      <Clock className="h-3 w-3" />
                      {executionTimeMs}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="copy-agent-output-btn"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy Output</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Formatted output container */}
              <div
                id="agent-output-content"
                className="max-h-[350px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-indigo-500/30"
              >
                {output}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
