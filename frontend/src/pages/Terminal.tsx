import { Terminal } from '../components/terminal/Terminal';

interface TerminalPageProps {
  projectId: string;
}

export function TerminalPage({ projectId }: TerminalPageProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 pb-16">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">Terminal</h1>
        <p className="text-slate-400 text-sm">{projectId}</p>
      </div>
      <div className="flex-1 p-4">
        <div className="h-full rounded-xl overflow-hidden border border-slate-700">
          <Terminal sessionId={projectId} />
        </div>
      </div>
    </div>
  );
}
