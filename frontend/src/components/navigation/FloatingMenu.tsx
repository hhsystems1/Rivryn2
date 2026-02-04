import { useState } from 'react';
import { Plus, X, Folder, MessageSquare, Terminal, Settings } from 'lucide-react';
import { useNavigation } from '../../stores/navigationStore';

type ModalPage = 'files' | 'agent' | 'terminal' | 'settings';

interface FloatingMenuProps {
  projectId: string;
  activeFile: string | null;
  onFileSelect: (file: string) => void;
}

export function FloatingMenu({ projectId, activeFile, onFileSelect }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePage, setActivePage] = useState<ModalPage>('files');
  const { setPage } = useNavigation();

  const menuItems = [
    { id: 'files' as ModalPage, icon: Folder, label: 'Files', color: 'bg-blue-500' },
    { id: 'agent' as ModalPage, icon: MessageSquare, label: 'Agent', color: 'bg-purple-500' },
    { id: 'terminal' as ModalPage, icon: Terminal, label: 'Terminal', color: 'bg-green-500' },
    { id: 'settings' as ModalPage, icon: Settings, label: 'Settings', color: 'bg-slate-500' },
  ];

  return (
    <>
      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-up Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh', height: 'auto' }}
      >
        {/* Handle bar */}
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page tabs */}
        <div className="flex border-b border-slate-700">
          {menuItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activePage === id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Page content */}
        <div className="p-4 overflow-auto" style={{ maxHeight: '50vh' }}>
          {activePage === 'files' && (
            <FileSheet
              projectId={projectId}
              activeFile={activeFile}
              onFileSelect={(file) => {
                onFileSelect(file);
                setIsOpen(false);
                setPage('code');
              }}
            />
          )}
          {activePage === 'agent' && <AgentSheet projectId={projectId} />}
          {activePage === 'terminal' && (
            <div className="text-center py-8 text-slate-400">
              <p>Open Terminal from bottom nav for full screen</p>
            </div>
          )}
          {activePage === 'settings' && (
            <div className="text-center py-8 text-slate-400">
              <p>Open Settings from bottom nav for full options</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// File Sheet Component
import { useEffect, useState as useState2 } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

function FileSheet({ projectId, activeFile, onFileSelect }: { projectId: string; activeFile: string | null; onFileSelect: (file: string) => void }) {
  const [files, setFiles] = useState2<FileNode[]>([]);
  const [loading, setLoading] = useState2(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/files/${projectId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Files API response:', data);
        setFiles(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Files API error:', err);
        setFiles([]);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading...</div>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <Folder className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-2">No files yet</p>
        <p className="text-slate-500 text-sm">Create a file or use the agent to generate code</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file) => (
        <button
          key={file.path}
          onClick={() => file.type === 'file' && onFileSelect(file.path)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
            activeFile === file.path
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-700 text-slate-200'
          }`}
        >
          <span className="text-lg">{file.type === 'directory' ? '📁' : '📄'}</span>
          <span className="text-sm truncate">{file.name}</span>
        </button>
      ))}
    </div>
  );
}

// Agent Sheet Component
function AgentSheet({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState2('');
  const [isLoading, setIsLoading] = useState2(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/agents/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectId }),
      });
      const data = await res.json();
      console.log('Agent response:', data);
      setPrompt('');
    } catch (err) {
      console.error('Agent error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
        <p className="text-sm text-slate-400 mb-3">Ask the AI agent to help you code:</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a React component for a login form..."
          className="w-full h-24 bg-slate-800 rounded-lg p-3 text-sm resize-none border border-slate-700 focus:border-purple-500 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {isLoading ? 'Thinking...' : 'Ask Agent'}
        </button>
      </div>
      
      <div className="text-sm text-slate-500">
        <p className="mb-2">Quick actions:</p>
        <div className="flex flex-wrap gap-2">
          {['Create component', 'Fix bugs', 'Add tests', 'Refactor'].map((action) => (
            <button
              key={action}
              onClick={() => setPrompt(action + ' for ')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-xs transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
