import { useState } from 'react';
import { Bot, Github, LogOut, ShieldAlert } from 'lucide-react';
import { logout, getUserEmail } from '../services/auth';

type ProviderName = 'ollama' | 'openai' | 'codex';

const PROVIDER_KEY = 'rivryn_llm_provider';
const OPENAI_KEY_KEY = 'rivryn_openai_api_key';
const CODEX_KEY_KEY = 'rivryn_codex_token';
const OLLAMA_KEY_KEY = 'rivryn_ollama_api_key';
const OLLAMA_HOST_KEY = 'rivryn_ollama_host';

function loadProvider(): ProviderName {
  return (localStorage.getItem(PROVIDER_KEY) as ProviderName) || 'ollama';
}

function loadApiKey(key: string): string {
  return localStorage.getItem(key) || '';
}

function saveToStorage(key: string, value: string): void {
  if (value) {
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
  }
}

export function SettingsPage({ onLogout }: { onLogout?: () => void }) {
  const userEmail = getUserEmail();

  const [llmProvider, setLlmProvider] = useState<ProviderName>(loadProvider);
  const [openaiKey, setOpenaiKey] = useState(loadApiKey(OPENAI_KEY_KEY));
  const [codexToken, setCodexToken] = useState(loadApiKey(CODEX_KEY_KEY));
  const [ollamaApiKey, setOllamaApiKey] = useState(loadApiKey(OLLAMA_KEY_KEY));
  const [ollamaHost, setOllamaHost] = useState(loadApiKey(OLLAMA_HOST_KEY) || 'https://api.ollama.ai');

  function handleLogout() {
    logout();
    onLogout?.();
  }

  return (
    <div className="h-full overflow-auto bg-slate-900 text-slate-200 p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">LLM provider and account settings</p>
      </div>

      <div className="space-y-4">
        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-3">Account</h2>
          {userEmail && (
            <p className="text-sm text-slate-300 mb-3">Signed in as <strong>{userEmail}</strong></p>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-600/50 text-red-300 hover:bg-red-600/10 px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </section>

        <section className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400" />
            LLM Provider
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Provider</label>
              <select
                value={llmProvider}
                onChange={(e) => {
                  const val = e.target.value as ProviderName;
                  setLlmProvider(val);
                  saveToStorage(PROVIDER_KEY, val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="ollama">Ollama (Cloud)</option>
                <option value="openai">OpenAI GPT</option>
                <option value="codex">Codex / GitHub Copilot</option>
              </select>
            </div>

            {llmProvider === 'ollama' && (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ollama Host</label>
                  <input
                    value={ollamaHost}
                    onChange={(e) => {
                      setOllamaHost(e.target.value);
                      saveToStorage(OLLAMA_HOST_KEY, e.target.value);
                    }}
                    placeholder="https://api.ollama.ai"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ollama API Key (optional)</label>
                  <input
                    type="password"
                    value={ollamaApiKey}
                    onChange={(e) => {
                      setOllamaApiKey(e.target.value);
                      saveToStorage(OLLAMA_KEY_KEY, e.target.value);
                    }}
                    placeholder="ollama_api_key"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {llmProvider === 'openai' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    saveToStorage(OPENAI_KEY_KEY, e.target.value);
                  }}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {llmProvider === 'codex' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Codex / GitHub Copilot Token</label>
                <input
                  type="password"
                  value={codexToken}
                  onChange={(e) => {
                    setCodexToken(e.target.value);
                    saveToStorage(CODEX_KEY_KEY, e.target.value);
                  }}
                  placeholder="ghu_... or github_token"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
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
