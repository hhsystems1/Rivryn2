import { useState } from 'react';
import { Github, Settings2, Info, Key, Eye, EyeOff } from 'lucide-react';

interface ApiKeys {
  openai: string;
  anthropic: string;
  groq: string;
  ollama: string;
}

export function SettingsPage() {
  const [showKeys, setShowKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: localStorage.getItem('api_key_openai') || '',
    anthropic: localStorage.getItem('api_key_anthropic') || '',
    groq: localStorage.getItem('api_key_groq') || '',
    ollama: localStorage.getItem('ollama_host') || 'localhost:11434',
  });

  const handleSaveKey = (provider: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    if (provider === 'ollama') {
      localStorage.setItem('ollama_host', value);
    } else {
      localStorage.setItem(`api_key_${provider}`, value);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-4 pb-20 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">Configure RivRyn</p>
      </div>

      <div className="space-y-4">
        {/* API Keys - Bring Your Own Key */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold">API Keys</h2>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Bring your own API keys. Keys are stored locally in your browser.
          </p>
          
          <div className="space-y-4">
            {/* OpenAI */}
            <div>
              <label className="text-xs text-slate-400 uppercase font-medium mb-1.5 block">
                OpenAI API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.openai}
                onChange={(e) => handleSaveKey('openai', e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Anthropic */}
            <div>
              <label className="text-xs text-slate-400 uppercase font-medium mb-1.5 block">
                Anthropic API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.anthropic}
                onChange={(e) => handleSaveKey('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Groq */}
            <div>
              <label className="text-xs text-slate-400 uppercase font-medium mb-1.5 block">
                Groq API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.groq}
                onChange={(e) => handleSaveKey('groq', e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Ollama */}
            <div>
              <label className="text-xs text-slate-400 uppercase font-medium mb-1.5 block">
                Ollama Host
              </label>
              <input
                type="text"
                value={apiKeys.ollama}
                onChange={(e) => handleSaveKey('ollama', e.target.value)}
                placeholder="localhost:11434"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">About</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-400">
            <p>RivRyn v0.1.0</p>
            <p>AI-powered development environment</p>
          </div>
        </div>

        {/* Links */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Github className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">Links</h2>
          </div>
          <div className="space-y-2 text-sm">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:text-blue-300"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
