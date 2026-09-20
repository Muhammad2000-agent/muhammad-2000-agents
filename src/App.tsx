import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatGPTWorkspace } from './components/ChatGPTWorkspace';
import { HiveMindWorkspace } from './components/HiveMindWorkspace';
import { DomainNavigator } from './components/DomainNavigator';
import { AgentCard } from './components/AgentCard';
import { TaskExecutionModal } from './components/TaskExecutionModal';
import { SwarmModal } from './components/SwarmModal';
import { SmartAutoDispatcher } from './components/SmartAutoDispatcher';
import { TaskHistoryDrawer } from './components/TaskHistoryDrawer';
import { AgentCustomizerModal } from './components/AgentCustomizerModal';
import { Agent, TaskExecution } from './types';
import { searchAgentFleet, getAgentByNumber } from './data/agentFleet';
import { loadTaskHistory, saveTaskHistory } from './utils/storage';
import { Search, Sparkles, Layers, X, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';

function AppContent() {
  const { themeConfig, mode } = useAppTheme();
  const [language, setLanguage] = useState<'roman-urdu' | 'urdu' | 'english'>('roman-urdu');
  const [activeTab, setActiveTab] = useState<'chat' | 'workspace' | 'directory'>('chat');

  // Directory filter state
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(36);

  // Swarm & Execution state
  const [swarmAgents, setSwarmAgents] = useState<Agent[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskExecution[]>(() => loadTaskHistory());

  // Modals state
  const [selectedAgentForTask, setSelectedAgentForTask] = useState<Agent | null>(null);
  const [customizingAgent, setCustomizingAgent] = useState<Agent | null>(null);
  const [isSwarmModalOpen, setIsSwarmModalOpen] = useState<boolean>(false);
  const [isAutoDispatcherOpen, setIsAutoDispatcherOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Sync task history to localStorage
  useEffect(() => {
    saveTaskHistory(taskHistory);
  }, [taskHistory]);

  // Filtered agents list based on domain & query
  const filteredAgents = useMemo(() => {
    return searchAgentFleet(searchQuery, selectedDomainId, 2000);
  }, [searchQuery, selectedDomainId]);

  const displayedAgents = useMemo(() => {
    return filteredAgents.slice(0, visibleLimit);
  }, [filteredAgents, visibleLimit]);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleLimit(36);
  }, [selectedDomainId, searchQuery]);

  const handleToggleSwarm = (agent: Agent) => {
    setSwarmAgents((prev) => {
      const exists = prev.some((a) => a.id === agent.id);
      if (exists) {
        return prev.filter((a) => a.id !== agent.id);
      }
      if (prev.length >= 5) {
        alert(
          language === 'roman-urdu'
            ? 'Ek swarm mein maximum 5 agents shamil kiye ja sakte hain.'
            : language === 'urdu'
            ? 'ایک سوارم میں زیادہ سے زیادہ ۵ ایجنٹس شامل کیے جا سکتے ہیں۔'
            : 'You can add up to 5 agents in a collaborative swarm.'
        );
        return prev;
      }
      return [...prev, agent];
    });
  };

  const handleTaskComplete = (task: TaskExecution) => {
    setTaskHistory((prev) => [task, ...prev]);
  };

  const handleSaveCustomPrompt = (agentId: string, updatedPrompt: string) => {
    // In-memory update
    const num = parseInt(agentId.replace(/\D/g, ''), 10);
    if (num) {
      const target = getAgentByNumber(num);
      target.systemPrompt = updatedPrompt;
    }
  };

  return (
    <div className={`min-h-screen ${mode === 'light' ? 'bg-slate-50 text-slate-900' : `${themeConfig.bgClass} text-slate-100`} flex flex-col font-sans transition-colors duration-300`}>
      {/* Top Header */}
      <Header
        activeLanguage={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        swarmCount={swarmAgents.length}
        onOpenSwarm={() => setIsSwarmModalOpen(true)}
        onOpenAutoMatch={() => setIsAutoDispatcherOpen(true)}
        tasksCount={taskHistory.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <main className="flex-1 flex flex-col w-full h-[calc(100vh-53px)] overflow-hidden">
          <ChatGPTWorkspace
            language={language}
            onLanguageChange={setLanguage}
            onOpenExplorer={() => setActiveTab('directory')}
          />
        </main>
      ) : activeTab === 'workspace' ? (
        <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-3 sm:px-6">
          <HiveMindWorkspace language={language} />
        </main>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Domain Navigator Bar */}
          <DomainNavigator
            selectedDomainId={selectedDomainId}
            onSelectDomain={setSelectedDomainId}
            language={language}
          />

          <main className="mx-auto max-w-7xl w-full flex-1 px-4 py-5 sm:px-6 pb-24">
            {/* Search, Filter Bar & Quick Stats */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'roman-urdu'
                      ? 'Kisi bhi agent ka naam, #ID (e.g. 42), skill ya keyword search karein...'
                      : language === 'urdu'
                      ? 'کسی بھی ایجنٹ کا نام، نمبر یا مہارت تلاش کریں...'
                      : 'Search any agent by name, #ID (e.g. 42), skill, or keyword...'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <div className="text-xs text-slate-400 font-mono">
                  {language === 'roman-urdu' ? (
                    <>
                      Showing <span className="text-indigo-400 font-bold">{displayedAgents.length}</span> of{' '}
                      <span className="text-slate-200">{filteredAgents.length}</span> agents
                    </>
                  ) : (
                    <>
                      Showing <span className="text-indigo-400 font-bold">{displayedAgents.length}</span> of{' '}
                      <span className="text-slate-200">{filteredAgents.length}</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setIsAutoDispatcherOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    {language === 'roman-urdu'
                      ? 'Smart Auto-Dispatcher'
                      : language === 'urdu'
                      ? 'اسمارٹ آٹو ڈسپیچر'
                      : 'Auto-Dispatcher'}
                  </span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {displayedAgents.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center my-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">
                  {language === 'roman-urdu' ? 'Koi agent nahi mila' : 'No agents match your query'}
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  {language === 'roman-urdu'
                    ? 'Search query badal kar dekhein ya "All 2000 Agents" par click karein.'
                    : 'Try clearing the search query or selecting another domain.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDomainId('all');
                  }}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Grid of Agents */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onAssignTask={setSelectedAgentForTask}
                  onToggleSwarm={handleToggleSwarm}
                  onCustomize={setCustomizingAgent}
                  isInSwarm={swarmAgents.some((a) => a.id === agent.id)}
                  language={language}
                />
              ))}
            </div>

            {/* Load More Button */}
            {displayedAgents.length < filteredAgents.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 36)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-all shadow-md"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span>
                    {language === 'roman-urdu'
                      ? `Mazeed 36 Agents Load Karein (${filteredAgents.length - displayedAgents.length} Baqi)`
                      : language === 'urdu'
                      ? `مزید ایجنٹس لوڈ کریں (${filteredAgents.length - displayedAgents.length} باقی)`
                      : `Load More (${filteredAgents.length - displayedAgents.length} remaining)`}
                  </span>
                </button>
              </div>
            )}
          </main>

          {/* Floating Swarm Drawer at bottom */}
          {swarmAgents.length > 0 && (
            <aside aria-label="Swarm Collaboration Controls" className="fixed bottom-0 left-0 right-0 z-30 border-t border-indigo-500/30 bg-slate-950/95 backdrop-blur-md p-3 shadow-2xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-2 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        Swarm Ready: {swarmAgents.length} Agents Selected
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (Max 5)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {swarmAgents.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-slate-700"
                        >
                          #{a.id}
                          <button
                            onClick={() => handleToggleSwarm(a)}
                            className="text-slate-400 hover:text-rose-400 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSwarmAgents([])}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsSwarmModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                  >
                    <span>Launch Swarm</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Task Execution Modal */}
      {selectedAgentForTask && (
        <TaskExecutionModal
          agent={selectedAgentForTask}
          onClose={() => setSelectedAgentForTask(null)}
          onTaskCompleted={handleTaskComplete}
          language={language}
        />
      )}

      {/* Swarm Modal */}
      {isSwarmModalOpen && (
        <SwarmModal
          swarmAgents={swarmAgents}
          onRemoveAgent={(agentId) =>
            setSwarmAgents((prev) => prev.filter((a) => a.id !== agentId))
          }
          onClearSwarm={() => setSwarmAgents([])}
          onClose={() => setIsSwarmModalOpen(false)}
          language={language}
        />
      )}

      {/* Smart Auto-Dispatcher Modal */}
      {isAutoDispatcherOpen && (
        <SmartAutoDispatcher
          onClose={() => setIsAutoDispatcherOpen(false)}
          onSelectAgent={(agent) => {
            setIsAutoDispatcherOpen(false);
            setSelectedAgentForTask(agent);
          }}
          onLaunchSwarm={(agents) => {
            setIsAutoDispatcherOpen(false);
            setSwarmAgents(agents);
            setIsSwarmModalOpen(true);
          }}
          language={language}
        />
      )}

      {/* Task History Drawer */}
      {isHistoryOpen && (
        <TaskHistoryDrawer
          tasks={taskHistory}
          onClose={() => setIsHistoryOpen(false)}
          onClearHistory={() => setTaskHistory([])}
          onSelectTask={(task) => {
            // Find agent or open task details
            const num = parseInt(task.agentId.replace(/\D/g, ''), 10);
            if (num) {
              const agent = getAgentByNumber(num);
              setSelectedAgentForTask(agent);
            }
          }}
        />
      )}

      {/* Agent Customizer Modal */}
      {customizingAgent && (
        <AgentCustomizerModal
          agent={customizingAgent}
          onClose={() => setCustomizingAgent(null)}
          onSaveCustomPrompt={handleSaveCustomPrompt}
          language={language}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
