import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CloudCog,
  Github,
  Link2,
  LogIn,
  LogOut,
  Save,
  ShieldAlert,
  Unplug
} from 'lucide-react';
import {
  AuditEvent,
  MemoryPayload,
  ProjectContextPayload,
  disconnectGoogle,
  getGoogleStatus,
  getAuthState,
  getGoogleConnected,
  getPrimaryAccountKey,
  loadAuditLog,
  loadMemory,
  loadProjectContext,
  onAuthStateChanged,
  readDeployStatus,
  saveMemory,
  saveProjectContext,
  setGoogleConnected,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startGoogleConnect
} from '../services/sidekick';

type SyncState = 'idle' | 'saving' | 'saved' | 'failed';

export function SettingsPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [googleConnected, setGoogleConnectedState] = useState(getGoogleConnected());
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleMessage, setGoogleMessage] = useState<string | null>(null);

  const [memory, setMemory] = useState<MemoryPayload>(loadMemory());
  const [memorySync, setMemorySync] = useState<SyncState>('idle');
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const [projectContext, setProjectContext] = useState<ProjectContextPayload>(loadProjectContext());
  const [contextSync, setContextSync] = useState<SyncState>('idle');
  const [contextError, setContextError] = useState<string | null>(null);

  const [auditLog, setAuditLog] = useState<AuditEvent[]>(loadAuditLog());
  const [deployStatus, setDeployStatus] = useState<string>('No deploy status loaded yet.');
  const [deployLoading, setDeployLoading] = useState(false);

  const sidekickConnected = Boolean(userId && getPrimaryAccountKey() === userId);

  useEffect(() => {
    hydrateAuth();
    const unsubscribe = onAuthStateChanged(() => {
      void hydrateAuth();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth_status');
    const hasAuthCode = params.has('code');
    const connected = oauthStatus === 'success' || hasAuthCode;
    if (connected) {
      setGoogleConnected(true);
      setGoogleConnectedState(true);
      setGoogleMessage('Google connection confirmed.');
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void (async () => {
      try {
        const status = await getGoogleStatus(accessToken);
        setGoogleConnectedState(status.connected);
      } catch {
        // keep local value when status endpoint is unavailable
      }
    })();
  }, [accessToken]);

  const authStatusLabel = useMemo(() => {
    if (sidekickConnected) {
      return 'Connected';
    }
    if (userId) {
      return 'Authenticated (not linked)';
    }
    return 'Disconnected';
  }, [sidekickConnected, userId]);

  async function hydrateAuth(): Promise<void> {
    const state = await getAuthState();
    setUserId(state.userId);
    setAccessToken(state.accessToken);
  }

  async function handleSignIn(event: FormEvent): Promise<void> {
    event.preventDefault();
    setAuthError(null);
    try {
      const id = await signInWithPassword(email.trim(), password);
      setUserId(id);
      const auth = await getAuthState();
      setAccessToken(auth.accessToken);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed');
    }
  }

  async function handleSignUp(event: FormEvent): Promise<void> {
    event.preventDefault();
    setAuthError(null);
    try {
      await signUpWithPassword(email.trim(), password);
      const id = await signInWithPassword(email.trim(), password);
      setUserId(id);
      const auth = await getAuthState();
      setAccessToken(auth.accessToken);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign up failed');
    }
  }

  async function handleDisconnect(): Promise<void> {
    await signOut();
    setUserId(null);
    setAccessToken(null);
    setGoogleConnected(false);
    setGoogleConnectedState(false);
  }

  async function handleConnectGoogle(): Promise<void> {
    if (!accessToken) {
      setGoogleMessage('Sign in first.');
      return;
    }
    setGoogleBusy(true);
    setGoogleMessage(null);
    try {
      const redirectTo = `${window.location.origin}/integrations`;
      const redirectUrl = await startGoogleConnect(accessToken, redirectTo);
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      setGoogleMessage('Google connect started.');
    } catch (error) {
      setGoogleMessage(error instanceof Error ? error.message : 'Google connect failed');
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleDisconnectGoogle(): Promise<void> {
    if (!accessToken) {
      setGoogleMessage('Sign in first.');
      return;
    }
    setGoogleBusy(true);
    try {
      await disconnectGoogle(accessToken);
      setGoogleConnectedState(false);
      setGoogleMessage('Google disconnected.');
    } catch (error) {
      setGoogleMessage(error instanceof Error ? error.message : 'Google disconnect failed');
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleSaveMemory(): Promise<void> {
    if (!userId) {
      setMemoryError('Sign in before saving memory.');
      setMemorySync('failed');
      return;
    }

    setMemorySync('saving');
    setMemoryError(null);
    const result = await saveMemory(userId, memory);
    setMemorySync(result.sync === 'saved' ? 'saved' : 'failed');
    setMemoryError(result.error || null);
    setAuditLog(loadAuditLog());
  }

  async function handleSaveProjectContext(): Promise<void> {
    if (!userId) {
      setContextError('Sign in before saving project context.');
      setContextSync('failed');
      return;
    }
    setContextSync('saving');
    setContextError(null);
    const result = await saveProjectContext(userId, projectContext);
    setContextSync(result.sync === 'saved' ? 'saved' : 'failed');
    setContextError(result.error || null);
    setAuditLog(loadAuditLog());
  }

  async function handleReadDeployStatus(): Promise<void> {
    if (!userId) {
      setDeployStatus('Sign in before reading deploy status.');
      return;
    }
    setDeployLoading(true);
    try {
      const output = await readDeployStatus(userId);
      setDeployStatus(output);
    } catch (error) {
      setDeployStatus(error instanceof Error ? error.message : 'Failed to read deploy status.');
    } finally {
      setDeployLoading(false);
    }
  }

  return (
    <div className="h-full overflow-auto bg-slate-900 text-slate-200 p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">Sidekick connection, memory, context, and deployment status</p>
      </div>

      <div className="space-y-4">
        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              Connect Sidekick
            </h2>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                sidekickConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {authStatusLabel}
            </span>
          </div>

          <form className="grid gap-2 md:grid-cols-2" onSubmit={handleSignIn}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm"
            >
              Sign up
            </button>
          </form>

          {userId && (
            <div className="mt-3 text-xs text-slate-300">
              Primary account key: <code>{userId}</code>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700"
            >
              <span className="inline-flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                Disconnect Sidekick
              </span>
            </button>
          </div>

          {authError && <p className="mt-2 text-xs text-red-300">{authError}</p>}
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-3">Google Integration (Gmail + Drive)</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                googleConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {googleConnected ? 'Connected' : 'Disconnected'}
            </span>
            <button
              onClick={handleConnectGoogle}
              disabled={googleBusy}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-3 py-2 text-sm"
            >
              Connect Google
            </button>
            <button
              onClick={handleDisconnectGoogle}
              disabled={googleBusy}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700 disabled:text-slate-500"
            >
              <span className="inline-flex items-center gap-1">
                <Unplug className="w-4 h-4" />
                Disconnect Google
              </span>
            </button>
          </div>
          {googleMessage && <p className="mt-2 text-xs text-slate-300">{googleMessage}</p>}
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Memory</h2>
            <SyncBadge status={memorySync} />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Base memory (SOPs, legal, defaults)</label>
              <textarea
                value={memory.baseMemory}
                onChange={(e) => setMemory((prev) => ({ ...prev, baseMemory: e.target.value }))}
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-[180px_1fr]">
              <input
                value={memory.overlayAgent}
                onChange={(e) => setMemory((prev) => ({ ...prev, overlayAgent: e.target.value }))}
                placeholder="agent id (e.g. coder)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={memory.overlayText}
                onChange={(e) => setMemory((prev) => ({ ...prev, overlayText: e.target.value }))}
                placeholder="Per-agent overlay guidance"
                className="h-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSaveMemory}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Memory (Explicit)
            </button>
            {memoryError && <p className="text-xs text-amber-300">{memoryError}</p>}
          </div>
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Project Context</h2>
            <SyncBadge status={contextSync} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={projectContext.projectName}
              onChange={(e) => setProjectContext((prev) => ({ ...prev, projectName: e.target.value }))}
              placeholder="Project name"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={projectContext.repoUrl}
              onChange={(e) => setProjectContext((prev) => ({ ...prev, repoUrl: e.target.value }))}
              placeholder="Repo URL"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={projectContext.deploymentTarget}
              onChange={(e) => setProjectContext((prev) => ({ ...prev, deploymentTarget: e.target.value }))}
              placeholder="Deployment target (netlify/vercel)"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={projectContext.approvalRules}
              onChange={(e) => setProjectContext((prev) => ({ ...prev, approvalRules: e.target.value }))}
              placeholder="Approval rules"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSaveProjectContext}
            className="mt-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Project Context
          </button>
          {contextError && <p className="mt-2 text-xs text-amber-300">{contextError}</p>}
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-2">Safety Approval Rules</h2>
          <p className="text-xs text-slate-400 mb-3">
            Money, security, data deletion, and external messaging actions require approval.
          </p>
          <div className="text-xs text-slate-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-400" />
            Approval gating is enforced in UI action handlers before sensitive operations run.
          </div>
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <CloudCog className="w-4 h-4 text-blue-400" />
              Deploy Status + Logs
            </h2>
            <button
              onClick={handleReadDeployStatus}
              disabled={deployLoading}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-3 py-2 text-sm"
            >
              {deployLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <pre className="text-xs bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-auto max-h-56 whitespace-pre-wrap">
            {deployStatus}
          </pre>
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-2">Audit Log</h2>
          <div className="space-y-2 max-h-64 overflow-auto">
            {auditLog.length === 0 && <p className="text-xs text-slate-400">No audit events yet.</p>}
            {auditLog.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-200">{event.summary}</span>
                  <span className={event.sync === 'saved' ? 'text-emerald-300' : 'text-amber-300'}>
                    {event.sync}
                  </span>
                </div>
                <div className="text-slate-400 mt-1">
                  {event.scope} • {event.actorId} • {new Date(event.timestamp).toLocaleString()}
                </div>
                {event.error && <div className="text-amber-300 mt-1">{event.error}</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-2">Links</h2>
          <a
            href="https://github.com/brendonc-h/riv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            GitHub Repository
          </a>
        </section>
      </div>
    </div>
  );
}

function SyncBadge({ status }: { status: SyncState }) {
  if (status === 'idle') {
    return <span className="text-xs text-slate-400">Not saved</span>;
  }
  if (status === 'saving') {
    return <span className="text-xs text-blue-300">Saving...</span>;
  }
  if (status === 'saved') {
    return (
      <span className="text-xs text-emerald-300 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Saved
      </span>
    );
  }
  return <span className="text-xs text-amber-300">Failed</span>;
}
