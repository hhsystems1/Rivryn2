import { useEffect, useState } from 'react';
import { FileTree } from '../file-explorer/FileTree';
import { FileNode } from '../../services/files';
import { apiUrl } from '../../config/runtime';

interface SidebarProps {
  projectId: string;
  onFileSelect: (path: string) => void;
  activeFile: string | null;
}

export function Sidebar({ projectId, onFileSelect, activeFile }: SidebarProps) {
  const [files, setFiles] = useState<FileNode[]>([]);

  useEffect(() => {
    fetch(apiUrl(`/api/files/${projectId}`))
      .then(res => res.json())
      .then(data => setFiles(data.items || []))
      .catch(() => setFiles([]));
  }, [projectId]);

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">
        Explorer
      </div>
      <FileTree
        files={files}
        onSelect={onFileSelect}
        activePath={activeFile}
        projectId={projectId}
      />
    </div>
  );
}
