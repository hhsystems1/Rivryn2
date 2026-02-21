import { useEffect, useState } from 'react';
import { useNavigation, Page } from './stores/navigationStore';
import Navbar from './components/navigation/Navbar';
import { Dashboard } from './pages/Dashboard';
import { WorkspacePage } from './pages/Workspace';
import { TerminalPage } from './pages/Terminal';
import { AgentsPage } from './pages/Agents';
import { IntegrationsPage } from './pages/Integrations';
import { SettingsPage } from './pages/Settings';
import { apiUrl } from './config/runtime';

interface PendingApproval {
  action: string;
  reason: string;
}

function App() {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string>('default');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const { currentPage, setPage } = useNavigation();

  const sensitiveReasons: Record<string, string> = {
    deploy: 'This can impact production and money-related usage.',
    security: 'This changes security posture.',
    secrets: 'This exposes or mutates sensitive credentials.',
    database: 'This can mutate or delete data.',
    auth: 'This changes account access behavior.',
    api: 'This can trigger external messaging or external calls.',
    cloud: 'This can affect paid infrastructure.',
    users: 'This changes user access and security.'
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    setPage('files');
  };

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/integrations') {
      setPage('integrations');
    }
  }, [setPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onSelectProject={handleSelectProject} />;
      case 'files':
      case 'code':
        return (
          <WorkspacePage
            projectId={activeProject}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
          />
        );
      case 'terminal':
        return <TerminalPage projectId={activeProject} />;
      case 'agents':
        return <AgentsPage />;
      case 'integrations':
        return <IntegrationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onSelectProject={handleSelectProject} />;
    }
  };

  const checkDevServerStatus = async () => {
    if (!activeProject || activeProject === 'default') {
      setStatusMessage('Select or create a project first.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setStatusMessage('Checking dev server status...');
    try {
      const res = await fetch(apiUrl(`/api/terminal/${encodeURIComponent(activeProject)}/exec`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command:
            'ps aux | grep -E "(vite|next dev|react-scripts start|npm run dev|pnpm dev|yarn dev)" | grep -v grep >/dev/null && echo RUNNING || echo STOPPED',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to check status');
      }
      const running = String(data.output || '').includes('RUNNING');
      setStatusMessage(running ? 'Dev server is running.' : 'Dev server is not running.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to check status';
      setStatusMessage(`Could not check dev server: ${message}`);
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const executeAction = async (action: string) => {
    const comingSoon = (label: string) => {
      setStatusMessage(`${label} is coming soon.`);
      setTimeout(() => setStatusMessage(null), 2200);
    };

    switch (action) {
      case 'run':
        await checkDevServerStatus();
        break;
      case 'preview':
        setPage('agents');
        break;
      case 'agent-chat':
      case 'skills-ai':
      case 'mcp-servers':
        setPage('agents');
        comingSoon('Advanced AI tools');
        break;
      case 'deploy':
        comingSoon('Deploy');
        break;
      case 'database':
        comingSoon('Database');
        break;
      case 'auth':
        comingSoon('Auth');
        break;
      case 'secrets':
        comingSoon('Secrets');
        break;
      case 'users':
        comingSoon('Team');
        break;
      case 'analytics':
        comingSoon('Analytics');
        break;
      case 'api':
        comingSoon('API');
        break;
      case 'cloud':
        comingSoon('Cloud');
        break;
      case 'security':
        comingSoon('Security');
        break;
      case 'git':
        comingSoon('Git tools');
        break;
      case 'debug':
        comingSoon('Debugger');
        break;
      case 'packages':
        comingSoon('Package manager');
        break;
      case 'integrations':
        setPage('integrations');
        break;
      case 'exit-project':
        setActiveProject('default');
        setActiveFile(null);
        setPage('dashboard');
        break;
      default:
        console.info(`Unknown action: ${action}`);
    }
  };

  const handleAction = async (action: string) => {
    const reason = sensitiveReasons[action];
    if (reason) {
      setPendingApproval({ action, reason });
      return;
    }
    await executeAction(action);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {renderPage()}
      </div>
      {statusMessage && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-800/95 px-4 py-2 text-sm text-slate-100 shadow-lg">
          {statusMessage}
        </div>
      )}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-lg font-semibold">Approval Required</h3>
            <p className="text-sm text-slate-300 mt-2">{pendingApproval.reason}</p>
            <p className="text-xs text-slate-400 mt-2">
              Action: <code>{pendingApproval.action}</code>
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPendingApproval(null)}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = pendingApproval.action;
                  setPendingApproval(null);
                  await executeAction(action);
                }}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-2 text-sm"
              >
                Approve & Continue
              </button>
            </div>
          </div>
        </div>
      )}
      <Navbar
        onNavigate={(page) => setPage(page as Page)}
        onAction={handleAction}
      />
    </div>
  );
}

export default App;
