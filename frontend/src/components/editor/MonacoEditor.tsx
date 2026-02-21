import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { apiUrl } from '../../config/runtime';

interface MonacoEditorProps {
  projectId: string;
  filePath: string | null;
}

export function MonacoEditor({ projectId, filePath }: MonacoEditorProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!filePath) {
      setContent('');
      return;
    }
    fetch(apiUrl(`/api/files/${projectId}/${filePath}`))
      .then(res => res.json())
      .then(data => setContent(data.content || ''))
      .catch(() => setContent(''));
  }, [filePath, projectId]);

  const handleSave = (value: string | undefined) => {
    if (!filePath || !value) return;
    fetch(apiUrl(`/api/files/${projectId}/${filePath}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: value })
    });
  };

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Select a file to edit
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      value={content}
      onChange={handleSave}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on'
      }}
    />
  );
}
