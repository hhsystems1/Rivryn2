import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { MonacoEditor } from '../components/editor/MonacoEditor';
import { apiUrl } from '../config/runtime';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

interface WorkspacePageProps {
  projectId: string;
  activeFile: string | null;
  onFileSelect: (file: string) => void;
}

export function WorkspacePage({ projectId, activeFile, onFileSelect }: WorkspacePageProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [currentDir, setCurrentDir] = useState('');
  const [mobileView, setMobileView] = useState<'files' | 'editor'>('files');
  const [message, setMessage] = useState<string | null>(null);

  const fetchFiles = async (dir = currentDir) => {
    setLoading(true);
    const prefix = dir ? `${projectId}/${dir}` : projectId;
    try {
      const res = await fetch(apiUrl(`/api/files/${prefix}`));
      const data = await res.json();
      const nextFiles: FileNode[] = (data.items || []).map((item: FileNode) => ({
        ...item,
        path: stripProjectPrefix(item.path, projectId)
      }));
      setFiles(nextFiles);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentDir('');
    fetchFiles('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const breadcrumbs = useMemo(() => {
    if (!currentDir) return [];
    return currentDir.split('/').filter(Boolean);
  }, [currentDir]);

  const createItem = async () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    const fullPath = currentDir ? `${currentDir}/${trimmed}` : trimmed;
    try {
      await fetch(apiUrl(`/api/files/${projectId}/${fullPath}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createType === 'directory' ? { type: 'directory' } : { type: 'file', content: '' })
      });
      setNewItemName('');
      fetchFiles(currentDir);
      if (createType === 'file') {
        onFileSelect(fullPath);
        setMobileView('editor');
      }
      setMessage(`${createType === 'file' ? 'File' : 'Folder'} created.`);
    } catch {
      setMessage(`Failed to create ${createType}.`);
    }
  };

  const openDirectory = (dirPath: string) => {
    const next = stripProjectPrefix(dirPath, projectId);
    setCurrentDir(next);
    fetchFiles(next);
  };

  const goToBreadcrumb = (index: number) => {
    const next = breadcrumbs.slice(0, index + 1).join('/');
    setCurrentDir(next);
    fetchFiles(next);
  };

  const goRoot = () => {
    setCurrentDir('');
    fetchFiles('');
  };

  const deleteItem = async (targetPath: string) => {
    try {
      await fetch(apiUrl(`/api/files/${projectId}/${targetPath}`), { method: 'DELETE' });
      if (activeFile === targetPath) {
        onFileSelect('');
      }
      fetchFiles(currentDir);
      setMessage('Deleted.');
    } catch {
      setMessage('Delete failed.');
    }
  };

  return (
    <div className="h-full bg-slate-900 text-slate-200 flex flex-col pb-16">
      <div className="h-14 px-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
        <div className="text-sm">
          <p className="font-semibold">Workspace</p>
          <p className="text-xs text-slate-400 truncate max-w-[220px]">{projectId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchFiles(currentDir)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={createItem}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            title="Create item from input"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      {message && (
        <div className="px-4 py-2 text-xs text-indigo-300 border-b border-slate-800 bg-slate-900/80">{message}</div>
      )}

      <div className="md:hidden flex border-b border-slate-700">
        <button
          onClick={() => setMobileView('files')}
          className={`flex-1 py-2 text-sm ${mobileView === 'files' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Files
        </button>
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-sm ${mobileView === 'editor' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
        >
          Editor
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        <aside className={`${mobileView === 'editor' ? 'hidden md:flex' : 'flex'} md:w-80 w-full border-r border-slate-700 flex-col`}>
          <div className="px-3 py-2 border-b border-slate-700">
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2 overflow-x-auto">
              <button onClick={goRoot} className="hover:text-white">root</button>
              {breadcrumbs.map((part, idx) => (
                <span key={`${part}-${idx}`} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  <button onClick={() => goToBreadcrumb(idx)} className="hover:text-white whitespace-nowrap">
                    {part}
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as 'file' | 'directory')}
                className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="file">File</option>
                <option value="directory">Folder</option>
              </select>
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createItem()}
                placeholder={createType === 'file' ? (currentDir ? `${currentDir}/file.tsx` : 'file.tsx') : 'new-folder'}
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {files.map((node) => (
              <div
                key={node.path}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 group ${
                  activeFile === node.path ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-slate-800'
                }`}
              >
                <button
                  onClick={() => {
                    if (node.type === 'directory') {
                      openDirectory(node.path);
                      return;
                    }
                    onFileSelect(node.path);
                    setMobileView('editor');
                  }}
                  className="flex-1 text-left flex items-center gap-2"
                >
                  {node.type === 'directory' ? (
                    currentDir && node.path === currentDir ? (
                      <FolderOpen className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Folder className="w-4 h-4 text-yellow-500" />
                    )
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="truncate">{node.name}</span>
                </button>
                <button
                  onClick={() => deleteItem(node.path)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {!loading && files.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-500">No files in this folder.</p>
            )}
          </div>
        </aside>

        <section className={`${mobileView === 'files' ? 'hidden md:block' : 'block'} flex-1 min-w-0`}>
          <MonacoEditor projectId={projectId} filePath={activeFile} />
        </section>
      </div>
    </div>
  );
}

function stripProjectPrefix(filePath: string, projectId: string): string {
  const prefix = `${projectId}/`;
  if (filePath.startsWith(prefix)) {
    return filePath.slice(prefix.length);
  }
  return filePath;
}
