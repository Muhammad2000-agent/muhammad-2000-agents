import React from 'react';
import { X, History, Copy, Check, Clock, Bot, Trash2 } from 'lucide-react';
import { TaskExecution } from '../types';

interface TaskHistoryDrawerProps {
  tasks: TaskExecution[];
  onClose: () => void;
  onClearHistory: () => void;
  onSelectTask: (task: TaskExecution) => void;
}

export const TaskHistoryDrawer: React.FC<TaskHistoryDrawerProps> = ({
  tasks,
  onClose,
  onClearHistory,
  onSelectTask,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Dispatched Tasks</h2>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {tasks.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {tasks.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-slate-500 hover:text-red-400 p-1 rounded"
                title="Clear all tasks"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-500 space-y-2">
              <Bot className="h-8 w-8 text-slate-700" />
              <p>Abhi tak koi task execute nahi hua.</p>
              <p className="text-[11px] text-slate-600">
                Kisi bhi agent par "Task Dein" dabayein aur output yahan save hoga.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 hover:border-indigo-500/40 hover:bg-slate-900 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-400">
                    #{task.agentId}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock className="h-3 w-3" />
                    <span>{task.durationMs}ms</span>
                    <span>&bull;</span>
                    <span>{task.timestamp}</span>
                  </div>
                </div>

                <h4 className="mt-1 text-xs font-semibold text-slate-200 group-hover:text-indigo-200 transition-colors">
                  {task.agentName}
                </h4>

                <p className="mt-1 text-xs text-slate-400 line-clamp-2 italic">
                  "{task.taskPrompt}"
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-800/60 pt-2 text-slate-500">
                  <span>Output Preview:</span>
                  <span className="text-emerald-400 font-medium">Completed &check;</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
