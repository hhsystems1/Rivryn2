import { Sidebar } from '../components/layout/Sidebar';

interface FilesPageProps {
  projectId: string;
  activeFile: string | null;
  onFileSelect: (file: string) => void;
}

export function FilesPage({ projectId, activeFile, onFileSelect }: FilesPageProps) {
  return (
    <div className="h-full bg-slate-900 text-slate-200 pb-16">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">Files</h1>
        <p className="text-slate-400 text-sm">{projectId}</p>
      </div>
      <Sidebar
        projectId={projectId}
        onFileSelect={onFileSelect}
        activeFile={activeFile}
      />
    </div>
  );
}
