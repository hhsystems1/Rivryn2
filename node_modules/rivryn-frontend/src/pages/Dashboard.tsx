import { useState } from 'react';
import { Plus, MessageSquare, Play, Folder } from 'lucide-react';

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

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    // TODO: Send to agent
    console.log('Prompt:', prompt);
    setPrompt('');
  };

  const createNewProject = async () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: 'New Project',
      description: 'Created just now',
      lastModified: 'Just now',
    };
    
    // Create project on backend
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newProject.id, name: newProject.name }),
      });
    } catch (err) {
      console.error('Failed to create project:', err);
    }
    
    setProjects([newProject, ...projects]);
    onSelectProject(newProject.id);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">RivRyn</h1>
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
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="w-full bg-slate-800 hover:bg-slate-750 rounded-xl p-4 border border-slate-700 text-left transition-colors"
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
