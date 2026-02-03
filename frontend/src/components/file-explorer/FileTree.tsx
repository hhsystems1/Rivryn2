interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

interface FileTreeProps {
  files: FileNode[];
  onSelect: (path: string) => void;
  activePath: string | null;
  projectId: string;
}

export function FileTree({ files, onSelect, activePath }: FileTreeProps) {
  const renderNode = (node: FileNode, depth = 0) => {
    const isActive = activePath === node.path;
    const paddingLeft = depth * 12 + 8;

    if (node.type === 'directory') {
      return (
        <div key={node.path} style={{ paddingLeft }}>
          <div className="py-1 px-2 text-slate-400 text-sm flex items-center gap-1">
            <span>📁</span>
            <span>{node.name}</span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onClick={() => onSelect(node.path)}
        className={`py-1 px-2 text-sm cursor-pointer flex items-center gap-1 ${
          isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
        }`}
        style={{ paddingLeft }}
      >
        <span>📄</span>
        <span>{node.name}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto py-2">
      {files.map(node => renderNode(node))}
    </div>
  );
}

export type { FileNode };
