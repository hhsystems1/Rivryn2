import { Bot } from 'lucide-react';
import { AgentChat } from '../components/agent/AgentChat';

export function AgentsPage() {
  const projectId = localStorage.getItem('rivryn_active_project') || 'default';

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/40">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold">Agent</h1>
        </div>
        <p className="text-xs text-slate-400">Autonomous coding agent for project: {projectId}</p>
      </div>
      <AgentChat projectId={projectId} />
    </div>
  );
}
