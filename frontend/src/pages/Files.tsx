import { useEffect, useState } from 'react';
import { ChevronLeft, Folder, FileText, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useNavigation } from '../stores/navigationStore';
import { apiUrl } from '../config/runtime';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

interface FilesPageProps {
  activeFile: string | null;
  onFileSelect: (file: string) => void;
}

export function FilesPage({ activeFile, onFileSelect }: FilesPageProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const { setPage } = useNavigation();

  const fetchFiles = () => {
    setLoading(true);
    fetch(apiUrl('/api/files/'))
      .then(res => res.json())
      .then(data => {
        setFiles(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setFiles([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = (path: string, type: string) => {
    if (type === 'file') {
      onFileSelect(path);
      setPage('code');
    }
  };

  const createNewFile = async () => {
    if (!newFileName.trim()) return;
    try {
      await fetch(apiUrl(`/api/files/${newFileName}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      });
      setNewFileName('');
      setShowNewFileInput(false);
      fetchFiles();
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const deleteFile = async (path: string) => {
    try {
      await fetch(apiUrl(`/api/files/${path}`), { method: 'DELETE' });
      fetchFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      const isActive = activeFile === node.path;
      const paddingLeft = depth * 16 + 12;

      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 py-2 px-3 group ${
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 border-r-2 border-indigo-500'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
            style={{ paddingLeft }}
          >
            <div
              onClick={() => handleFileClick(node.path, node.type)}
              className="flex items-center gap-2 flex-1 cursor-pointer"
            >
              {node.type === 'directory' ? (
                <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="text-sm truncate">{node.name}</span>
            </div>
            {node.type === 'file' && (
              <button
                onClick={() => deleteFile(node.path)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          {node.children && node.children.length > 0 && (
            <div>{renderFileTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage('dashboard')}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Files</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={fetchFiles}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* New File Input */}
      {showNewFileInput && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.js"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && createNewFile()}
            />
            <button
              onClick={createNewFile}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Folder className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs mt-1">Click + to create a file</p>
          </div>
        ) : (
          <div className="py-2">
            {renderFileTree(files)}
          </div>
        )}
      </div>
    </div>
  );
}
