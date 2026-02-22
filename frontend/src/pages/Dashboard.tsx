import { useState } from 'react';
import { Plus, MessageSquare, Play, Folder } from 'lucide-react';
import { apiUrl } from '../config/runtime';

interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: string;
}

const mockProjects: Project[] = [
  { id: '1', name: 'My App', description: 'React + TypeScript app', lastModified: '2 hours ago' },
  { id: '2', name: 'API Server', description: 'Express backend', lastModified: '1 day ago' },
  { id: '3', name: 'Python Script', description: 'Data processing', lastModified: '3 days ago' },
];

interface DashboardProps {
  onSelectProject: (projectId: string) => void;
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const [prompt, setPrompt] = useState('');
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    // TODO: Send to agent
    console.log('Prompt:', prompt);
    setPrompt('');
  };

  const createNewProject = async () => {
    setIsCreating(true);
    setCreateError(null);

    let newProject: Project = {
      id: Date.now().toString(),
      name: `Project ${projects.length + 1}`,
      description: 'Created just now',
      lastModified: 'Just now',
    };
    
    try {
      const res = await fetch(apiUrl('/api/projects/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProject.name, template: 'react-ts' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await res.json();
      if (project?.id) {
        newProject = {
          ...newProject,
          id: project.id,
          name: project.name || newProject.name,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setCreateError(message);
    }
    
    // Keep local UX flowing even when Docker is unavailable.
    setProjects([newProject, ...projects]);
    onSelectProject(newProject.id);
    setIsCreating(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-2xl font-black leading-none text-white">R</span>
          </div>
          <h1 className="text-3xl font-bold">RivRyn</h1>
        </div>
        <p className="text-slate-400 text-sm">Build with AI agents</p>
      </div>

      {/* Prompt Input */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <span className="font-medium">What would you like to build?</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a React todo app with TypeScript..."
          className="w-full h-24 bg-slate-900 rounded-lg p-3 text-sm resize-none border border-slate-700 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePromptSubmit}
            disabled={!prompt.trim()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Plan</span>
          </button>
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <button
            onClick={createNewProject}
            disabled={isCreating}
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm disabled:text-slate-500"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'New'}</span>
          </button>
        </div>

        {createError && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Backend project create failed: {createError}. Continuing in local mode.
          </div>
        )}

        <div className="space-y-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-4 border border-slate-700 text-left transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Folder className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{project.name}</h3>
                  <p className="text-slate-400 text-sm truncate">{project.description}</p>
                  <p className="text-slate-500 text-xs mt-1">{project.lastModified}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
