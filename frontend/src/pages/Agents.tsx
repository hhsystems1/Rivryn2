import { useState } from 'react';
import { Bot, Send, Wand2 } from 'lucide-react';
import { apiUrl } from '../config/runtime';

export function AgentsPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const runPlan = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/agents/plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: prompt }),
      });
      const data = await res.json();
      setResult(data.plan || data.error || 'No response');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Agent plan failed');
    } finally {
      setLoading(false);
    }
  };

  const runExecute = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/agents/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'coder', task: prompt }),
      });
      const data = await res.json();
      setResult(data.result || data.error || 'No response');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Agent execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-4 pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold">Agents</h1>
        </div>
        <p className="text-slate-400 text-sm">Plan and run AI agent tasks</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want the agent to do..."
          className="w-full h-24 bg-slate-900 rounded-lg p-3 text-sm resize-none border border-slate-700 focus:border-blue-500 focus:outline-none"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={runPlan}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-sm"
          >
            <Wand2 className="w-4 h-4" />
            Plan
          </button>
          <button
            onClick={runExecute}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-sm"
          >
            <Send className="w-4 h-4" />
            Execute
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-auto">
        <pre className="text-sm whitespace-pre-wrap break-words text-slate-200">
          {result || 'Agent output will appear here.'}
        </pre>
      </div>
    </div>
  );
}
