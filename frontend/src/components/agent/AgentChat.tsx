import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, ShieldAlert, CheckCircle2, XCircle, Terminal, FileText, FolderOpen, Trash2, Loader2 } from 'lucide-react';
import { runAgent, approveToolCall, AgentEvent } from '../../services/agent';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'tool' | 'system';
  content: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'pending_approval' | 'approved' | 'rejected' | 'complete' | 'error';
  toolCall?: { id: string; name: string; arguments: Record<string, unknown> };
  toolResult?: { success: boolean; output: string };
}

interface AgentChatProps {
  projectId: string;
}

export function AgentChat({ projectId }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{ callId: string; call: { id: string; name: string; arguments: Record<string, unknown> } } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((event: AgentEvent) => {
    const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    switch (event.type) {
      case 'thinking':
        setMessages((prev) => [...prev, {
          id: `thinking-${baseId}`,
          role: 'assistant',
          content: event.content,
          type: 'thinking'
        }]);
        break;

      case 'tool_call':
        setMessages((prev) => [...prev, {
          id: `tool-${baseId}`,
          role: 'tool',
          content: `Calling ${event.call.name}...`,
          type: 'tool_call',
          toolCall: event.call
        }]);
        break;

      case 'tool_result':
        setMessages((prev) => {
          const lastToolIdx = [...prev].reverse().findIndex(
            (m) => m.type === 'tool_call' && m.toolCall?.id === event.call.id
          );
          if (lastToolIdx >= 0) {
            const idx = prev.length - 1 - lastToolIdx;
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              content: event.result.success
                ? `✓ ${event.call.name} completed`
                : `✗ ${event.call.name} failed`,
              type: 'tool_result',
              toolResult: event.result,
              toolCall: updated[idx].toolCall
            };
            return updated;
          }
          return prev;
        });
        break;

      case 'pending_approval':
        setPendingApproval({ callId: event.callId, call: event.call });
        setMessages((prev) => [...prev, {
          id: `approval-${baseId}`,
          role: 'system',
          content: `Approval needed: ${event.call.name}`,
          type: 'pending_approval',
          toolCall: event.call
        }]);
        break;

      case 'approved':
        setPendingApproval(null);
        setMessages((prev) => [...prev, {
          id: `approved-${baseId}`,
          role: 'system',
          content: 'Approved',
          type: 'approved'
        }]);
        break;

      case 'rejected':
        setPendingApproval(null);
        setMessages((prev) => [...prev, {
          id: `rejected-${baseId}`,
          role: 'system',
          content: 'Rejected',
          type: 'rejected'
        }]);
        break;

      case 'complete':
        setMessages((prev) => [...prev, {
          id: `complete-${baseId}`,
          role: 'assistant',
          content: event.summary || 'Task completed.',
          type: 'complete'
        }]);
        break;

      case 'error':
        setMessages((prev) => [...prev, {
          id: `error-${baseId}`,
          role: 'system',
          content: event.message,
          type: 'error'
        }]);
        break;
    }
  }, []);

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || running) return;

    setPrompt('');
    setMessages((prev) => [...prev, {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'system',
      content: trimmed,
      type: 'thinking'
    }]);
    setRunning(true);

    const sid = await runAgent({
      prompt: trimmed,
      projectId,
      onEvent: addMessage,
      onError: (message) => {
        addMessage({ type: 'error', message });
      },
      onComplete: () => {
        setRunning(false);
      }
    });

    if (sid) setSessionId(sid);
  };

  const handleApprove = async (approved: boolean) => {
    if (!pendingApproval || !sessionId) return;
    try {
      await approveToolCall(sessionId, pendingApproval.callId, approved);
      addMessage({ type: approved ? 'approved' : 'rejected', callId: pendingApproval.callId });
      setPendingApproval(null);
    } catch (error) {
      addMessage({ type: 'error', message: error instanceof Error ? error.message : 'Approval failed' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toolIcon = (name: string) => {
    switch (name) {
      case 'write_file': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'read_file': return <FileText className="w-3.5 h-3.5 text-slate-400" />;
      case 'list_files': return <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />;
      case 'delete_file': return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case 'exec_command': return <Terminal className="w-3.5 h-3.5 text-green-400" />;
      default: return <Bot className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">Tell the agent what you want to build or change.</p>
            <p className="text-xs text-slate-600 mt-1">It can create and edit files, run commands, and more.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'system' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'system' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.type === 'error' ? 'bg-red-900/30 border border-red-800/40 text-red-300' :
              msg.type === 'thinking' && msg.role === 'system' ? 'bg-indigo-600/20 border border-indigo-800/40 text-indigo-200' :
              msg.type === 'thinking' ? 'bg-slate-800 border border-slate-700' :
              msg.type === 'tool_call' ? 'bg-slate-800/60 border border-slate-700/50' :
              msg.type === 'tool_result' ? 'bg-slate-800/40 border border-slate-700/30' :
              msg.type === 'pending_approval' ? 'bg-amber-900/20 border border-amber-700/40' :
              msg.type === 'approved' ? 'bg-emerald-900/20 border border-emerald-700/40' :
              msg.type === 'rejected' ? 'bg-red-900/20 border border-red-700/40' :
              msg.type === 'complete' ? 'bg-emerald-900/20 border border-emerald-700/40 text-emerald-200' :
              'bg-slate-800 border border-slate-700'
            }`}>
              {msg.type === 'tool_call' && msg.toolCall && (
                <div className="flex items-center gap-2 mb-1">
                  {toolIcon(msg.toolCall.name)}
                  <span className="font-mono text-xs text-slate-300">{msg.toolCall.name}</span>
                </div>
              )}

              {msg.type === 'tool_result' && msg.toolResult && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.toolResult.success
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />
                    }
                    <span className={`text-xs font-mono ${msg.toolResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                      {msg.toolResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {msg.toolResult.output && msg.toolResult.output.length > 200 ? (
                    <details className="mt-1">
                      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                        Show output ({msg.toolResult.output.length} chars)
                      </summary>
                      <pre className="mt-1 text-xs text-slate-400 whitespace-pre-wrap break-words max-h-40 overflow-y-auto bg-slate-900/50 rounded p-2">
                        {msg.toolResult.output}
                      </pre>
                    </details>
                  ) : (
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words">
                      {msg.toolResult.output}
                    </pre>
                  )}
                </div>
              )}

              {msg.type === 'thinking' && (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              )}

              {msg.type === 'pending_approval' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 text-sm font-medium">Approval Required</span>
                  </div>
                  {msg.toolCall && (
                    <div className="text-xs text-slate-300 mb-2 font-mono">
                      {msg.toolCall.name}({JSON.stringify(msg.toolCall.arguments, null, 2)})
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApprove(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(false)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {msg.type === 'complete' && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200 text-sm font-medium">Complete</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-xs text-slate-300">{msg.content}</p>
                </div>
              )}

              {msg.type === 'error' && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{msg.content}</span>
                </div>
              )}

              {msg.type === 'approved' && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Approved — continuing...</span>
                </div>
              )}

              {msg.type === 'rejected' && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300">Rejected — agent will adjust.</span>
                </div>
              )}
            </div>

            {msg.role === 'system' && (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-xs font-bold text-slate-300">U</span>
              </div>
            )}
          </div>
        ))}

        {running && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ml-9">
            <Loader2 className="w-4 h-4 animate-spin" />
            Agent is working...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-700 p-3 bg-slate-900">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell the agent what to do..."
            disabled={running}
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={running || !prompt.trim()}
            className="self-end p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
