import { Github, Settings2, Info } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">Configure RivRyn</p>
      </div>

      <div className="space-y-4">
        {/* AI Settings */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Settings2 className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">AI Configuration</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Model</span>
              <span className="text-slate-200">llama3.2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Host</span>
              <span className="text-slate-200">localhost:11434</span>
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
