import { useEffect, useState } from 'react';
import { Link2, Mail, HardDrive } from 'lucide-react';
import { getGoogleConnected, getGoogleStatus, getAuthState, setGoogleConnected } from '../services/sidekick';

export function IntegrationsPage() {
  const [googleConnected, setGoogleConnectedState] = useState(getGoogleConnected());
  const [statusMessage, setStatusMessage] = useState('Waiting for integration status.');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth_status');
    const code = params.get('code');
    const error = params.get('error');

    if (oauthStatus === 'success' || code) {
      setGoogleConnected(true);
      setGoogleConnectedState(true);
      setStatusMessage('Google account connected successfully.');
      return;
    }
    if (error) {
      setStatusMessage(`Google connection failed: ${error}`);
      return;
    }
    setStatusMessage(googleConnected ? 'Google is already connected.' : 'Google is not connected yet.');
  }, [googleConnected]);

  useEffect(() => {
    void (async () => {
      const auth = await getAuthState();
      if (!auth.accessToken) {
        return;
      }
      try {
        const status = await getGoogleStatus(auth.accessToken);
        setGoogleConnectedState(status.connected);
      } catch {
        // status remains based on local fallback
      }
    })();
  }, []);

  return (
    <div className="h-full overflow-auto bg-slate-900 text-slate-200 p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-6 h-6 text-blue-400" />
          Integrations
        </h1>
        <p className="text-slate-400 text-sm">{statusMessage}</p>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Gmail
            </span>
            <Badge connected={googleConnected} />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              Google Drive
            </span>
            <Badge connected={googleConnected} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
      }`}
    >
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  );
}
