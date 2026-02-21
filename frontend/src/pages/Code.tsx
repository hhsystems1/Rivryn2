import { MonacoEditor } from '../components/editor/MonacoEditor';

interface CodePageProps {
  projectId: string;
  activeFile: string | null;
}

export function CodePage({ projectId, activeFile }: CodePageProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 pb-16">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Code</h1>
          {activeFile && (
            <p className="text-slate-400 text-sm truncate max-w-[200px]">{activeFile}</p>
          )}
        </div>
        {!activeFile && (
          <p className="text-slate-500 text-sm">Select a file from Files tab</p>
        )}
      </div>
      <div className="flex-1 relative">
        <MonacoEditor projectId={projectId} filePath={activeFile} />
      </div>
    </div>
  );
}
