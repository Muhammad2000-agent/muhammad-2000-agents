import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  Download,
  RotateCcw,
  Lightbulb,
  FolderArchive,
  ArrowDownToLine,
  FileCode,
} from 'lucide-react';
import { HiveTaskMessage } from '../types';
import { loadChatHistory, saveChatHistory, clearSavedChatHistory } from '../utils/storage';
import { TaskDeliverableRenderer } from './TaskDeliverableRenderer';
import { BrandLogo } from './BrandLogo';
import { useAppTheme } from '../context/ThemeContext';
import { extractFilesFromDeliverable, downloadProjectAsZip } from '../utils/zipGenerator';

interface HiveMindWorkspaceProps {
  language: 'roman-urdu' | 'urdu' | 'english';
}

const SAMPLE_TASKS = {
  'roman-urdu': [
    {
      label: '🚀 E-Commerce Web App + Direct ZIP',
      prompt: 'Mera ek complete e-commerce store ka front-end aur cart backend system pura code karke do. HTML, CSS, JavaScript aur README files banao taake direct ZIP download ho sake.',
    },
    {
      label: '📈 Crypto & Trading Algorithm + Direct ZIP',
      prompt: 'Ek automated crypto trading bot ka risk calculation engine aur live market simulator banao Python mein. Pura runnable project banayein taake ZIP download ho jaye.',
    },
    {
      label: '🎨 3D Interactive Portfolio + Direct ZIP',
      prompt: 'Ek modern dark-theme developer portfolio website pura code karke do with three.js background, project showcase, contact form, aur responsive styles in index.html, style.css, script.js.',
    },
    {
      label: '⚡ Automation Script Pipeline + Direct ZIP',
      prompt: 'Ek high-performance file processing aur automation script pipeline pura implement karo with package.json, test cases, and README.',
    },
  ],
  urdu: [
    {
      label: '🚀 مکمل ای کامرس ویب ایپ + ڈائریکٹ زپ',
      prompt: 'آن لائن اسٹور کے لیے انوینٹری اور آرڈرز کا مکمل ورکنگ پروجیکٹ تیار کریں جس میں ایچ ٹی ایم ایل، سی ایس ایس اور جاوا اسکرپٹ کی تمام فائلز موجود ہوں تاکہ فوری زپ ڈاؤنلوڈ ہو سکے۔',
    },
    {
      label: '📈 مالیاتی مارکیٹ ٹریڈنگ اسکرپٹ + ڈائریکٹ زپ',
      prompt: 'کرپٹو اور اسٹاک ٹریڈنگ کے لیے مکمل رسک مینیجمنٹ الگورتھم پائتھون میں ڈیزائن کریں۔',
    },
    {
      label: '🎨 جدید پورٹ فولیو ویب سائٹ + ڈائریکٹ زپ',
      prompt: 'ایک شاندار ڈارک تھیم پورٹ فولیو ویب سائٹ کا مکمل کوڈ انڈیکس فائلز اور اسٹائلز کے ساتھ تیار کریں۔',
    },
  ],
  english: [
    {
      label: '🚀 Full-Stack Web Project + Direct ZIP',
      prompt: 'Build a production-grade e-commerce storefront with product cards, cart state, index.html, style.css, script.js, and README.md ready for direct ZIP download.',
    },
    {
      label: '📈 Quantitative Trading Engine + Direct ZIP',
      prompt: 'Design a complete Python quantitative risk management engine computing volatility metrics, trailing stop losses, and Sharpe ratios with complete files.',
    },
    {
      label: '🎨 Modern 3D Canvas Portfolio + Direct ZIP',
      prompt: 'Create a stunning interactive dark-mode developer portfolio with animated canvas, project cards, and clean modular files.',
    },
    {
      label: '⚡ Automated Data Pipeline + Direct ZIP',
      prompt: 'Synthesize a complete file processing pipeline with unit tests, configuration, and execution scripts packaged for instant ZIP download.',
    },
  ],
};

export const HiveMindWorkspace: React.FC<HiveMindWorkspaceProps> = ({
  language,
}) => {
  const { themeConfig } = useAppTheme();
  const [promptInput, setPromptInput] = useState('');
  const [messages, setMessages] = useState<HiveTaskMessage[]>(() => loadChatHistory());
  const [isExecuting, setIsExecuting] = useState(false);
  const [activePhase, setActivePhase] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDirectZipMode, setIsDirectZipMode] = useState<boolean>(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist chat history to localStorage whenever messages change
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting, activePhase]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (prompt: string, text: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDirectZip = async (prompt: string, text: string) => {
    const cleanName = prompt.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
    const extracted = extractFilesFromDeliverable(text, cleanName);
    await downloadProjectAsZip(extracted.files, extracted.projectName);
  };

  const handleClearChat = () => {
    setMessages([]);
    clearSavedChatHistory();
  };

  const handleExecuteTask = async (taskToRun?: string) => {
    const text = (taskToRun || promptInput).trim();
    if (!text || isExecuting) return;

    const messageId = `msg-${Date.now()}`;
    const userMessage: HiveTaskMessage = {
      id: messageId,
      role: 'user',
      prompt: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'processing',
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsExecuting(true);

    // Subtle, clean phase updates while server computes
    const phases = [
      language === 'roman-urdu'
        ? 'Task analyze ho raha hai...'
        : language === 'urdu'
        ? 'کام کا جائزہ لیا جا رہا ہے...'
        : 'Analyzing request & requirements...',
      language === 'roman-urdu'
        ? 'Autonomous tools aur intelligence process ho rahi hai...'
        : language === 'urdu'
        ? 'ٹولز اور انٹیلی جنس پروسیس ہو رہی ہے...'
        : 'Executing autonomous tools & intelligence...',
      language === 'roman-urdu'
        ? 'Final response synthesize ho rahi hai...'
        : language === 'urdu'
        ? 'مکمل جواب تیار کیا جا رہا ہے...'
        : 'Synthesizing complete solution...',
    ];

    let phaseIndex = 0;
    setActivePhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setActivePhase(phases[phaseIndex]);
    }, 2500);

    try {
      const response = await fetch('/api/hive/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskPrompt: text,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.role === 'user' ? m.prompt : m.result || '',
          })),
          languagePreference: language,
        }),
      });

      const data = await response.json();
      clearInterval(phaseInterval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete task.');
      }

      // Update message with backend result
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: 'completed',
                result: data.finalResult,
                durationMs: data.durationMs,
                mobilizedAgents: data.mobilizedAgents || [],
                spawnedAgents: data.spawnedAgents || [],
                toolsUsed: data.toolsUsed || [],
                communitySteps: data.communitySteps || [],
              }
            : msg
        )
      );
    } catch (err: any) {
      clearInterval(phaseInterval);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: 'error',
                errorMessage: err.message || 'Kuch masla paish aya. Dobara koshish karein.',
              }
            : msg
        )
      );
    } finally {
      setIsExecuting(false);
      setActivePhase('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecuteTask();
    }
  };

  const currentSamples = SAMPLE_TASKS[language] || SAMPLE_TASKS['roman-urdu'];

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-4.5rem)] w-full py-4 space-y-6">
      {/* Main Chat Stream */}
      <div className="flex-1 space-y-6">
        {messages.length === 0 ? (
          /* Empty State - Clean, Pure Chat Center with Direct ZIP & Brand */
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center space-y-6">
            <div className="relative">
              <BrandLogo size="hero" showText={false} />
            </div>

            <div className="max-w-xl space-y-2 px-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-1 shadow-sm">
                <FolderArchive className="h-3.5 w-3.5" />
                <span>Direct ZIP Delivery Ready • Pura Kaam 1-Click Mein</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {language === 'roman-urdu'
                  ? 'Muhammad 2000 AI Agents'
                  : language === 'urdu'
                  ? 'محمد 2000 اے آئی ایجنٹس'
                  : 'Muhammad 2000 AI Agents'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {language === 'roman-urdu'
                  ? 'Code prompts lene ki zaroorat nahi — aap jo banwana chahein, 2,000 agents mukammal project files bana kar direct ZIP download ke liye tayyar kar dete hain.'
                  : language === 'urdu'
                  ? 'کوڈ پرامپٹ مانگنے کے بجائے مکمل پروجیکٹ تیار شدہ زپ (ZIP) فائل کی صورت میں ڈاؤنلوڈ کریں۔'
                  : 'Zero coding prompts needed — tell us what to build and our 2,000 agents generate complete project files packaged for direct 1-click ZIP download.'}
              </p>
            </div>

            {/* Quick Sample Prompts */}
            <div className="w-full max-w-xl space-y-2 pt-2 px-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <span>Example Tasks:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {currentSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExecuteTask(sample.prompt)}
                    className="group rounded-xl border border-slate-800/90 bg-slate-900/50 p-3 text-xs hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-slate-300 flex flex-col justify-between"
                  >
                    <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {sample.label}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-400 line-clamp-2 italic">
                      "{sample.prompt}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Messages */
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                {/* User Message Bubble */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="max-w-2xl rounded-2xl bg-indigo-600 px-4 py-3 text-sm text-white shadow-md">
                    <p className="whitespace-pre-wrap">{msg.prompt}</p>
                    <div className="mt-1 text-right text-[10px] text-indigo-200">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>

                {/* AI Result Card */}
                {msg.status === 'processing' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-400 shadow-md">
                      <Cpu className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
                        <span className="text-xs font-semibold text-indigo-300">
                          {language === 'roman-urdu'
                            ? 'AI Assistant kaam kar raha hai...'
                            : language === 'urdu'
                            ? 'اے آئی کام کر رہا ہے...'
                            : 'Processing request...'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 font-mono animate-pulse">
                        {activePhase || 'Working on your task...'}
                      </p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-500"></div>
                      </div>
                    </div>
                  </div>
                ) : msg.status === 'error' ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 space-y-2">
                    <p className="font-semibold">Execution Error:</p>
                    <p>{msg.errorMessage}</p>
                    <button
                      onClick={() => handleExecuteTask(msg.prompt)}
                      className="inline-flex items-center gap-1 rounded bg-red-600/30 px-2 py-1 text-[11px] text-red-200 hover:bg-red-600/50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                      <Bot className="h-5 w-5" />
                    </div>

                    <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl space-y-4 overflow-hidden">
                      {/* Clean Header of Result */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>
                              {language === 'roman-urdu'
                                ? 'Mukammal & Deliver'
                                : language === 'urdu'
                                ? 'مکمل جواب'
                                : 'Complete'}
                            </span>
                          </span>
                          {msg.durationMs && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {msg.durationMs}ms
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(msg.id, msg.result || '')}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                            title="Copy full output"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDownloadDirectZip(msg.prompt, msg.result || '')}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-900/40 transition-colors font-medium shadow-sm"
                            title="Direct Project ZIP Download (Pura Kaam Ready)"
                          >
                            <FolderArchive className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Direct ZIP</span>
                          </button>

                          <button
                            onClick={() => handleDownload(msg.prompt, msg.result || '')}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                            title="Download markdown file"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Export</span>
                          </button>
                        </div>
                      </div>

                      {/* Primary Output (Rendered Deliverable Markdown, Code Sandbox & Proof of Work) */}
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 sm:p-5 text-slate-100 overflow-x-auto selection:bg-indigo-500/30">
                        <TaskDeliverableRenderer
                          content={msg.result || ''}
                          durationMs={msg.durationMs}
                          mobilizedAgents={msg.mobilizedAgents}
                          spawnedAgents={msg.spawnedAgents}
                          toolsUsed={msg.toolsUsed}
                          communitySteps={msg.communitySteps}
                          language={language}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Primary Bottom Prompt Input Bar */}
      <div className="sticky bottom-4 z-20 space-y-2">
        <div className="relative rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <textarea
            ref={textareaRef}
            id="chat-task-input"
            rows={2}
            value={promptInput}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder={
              language === 'roman-urdu'
                ? 'Apna koi bhi task ya sawaal yahan likhein...'
                : language === 'urdu'
                ? 'اپنا کوئی بھی کام یا سوال یہاں لکھیں...'
                : 'Type your message or task here...'
            }
            className="w-full resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />

          <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-2 px-2 text-xs gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDirectZipMode(!isDirectZipMode)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isDirectZipMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Direct ZIP Mode: Guarantees full project files for 1-click ZIP package download"
              >
                <FolderArchive className="h-3.5 w-3.5 text-emerald-400" />
                <span>Direct ZIP Delivery {isDirectZipMode ? 'ON' : 'OFF'}</span>
              </button>
              <span className="hidden sm:inline text-slate-500 text-[11px]">
                (Pura kaam ready in .zip)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-xs"
                >
                  Clear Chat
                </button>
              )}

              <button
                id="send-chat-btn"
                type="button"
                onClick={() => handleExecuteTask()}
                disabled={!promptInput.trim() || isExecuting}
                className={`flex items-center gap-1.5 rounded-xl ${themeConfig.activeTabClass} px-4 py-2 text-xs font-semibold text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
              >
                {isExecuting ? (
                  <>
                    <Cpu className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'roman-urdu' ? 'Bheinjen' : language === 'urdu' ? 'بھیجیں' : 'Send'}</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
