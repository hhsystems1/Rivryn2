export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

export async function fetchFiles(projectId: string, path: string = ''): Promise<FileNode[]> {
  const res = await fetch(`/api/files/${projectId}/${path}`);
  const data = await res.json();
  return data.items || [];
}

export async function fetchFileContent(projectId: string, path: string): Promise<string> {
  const res = await fetch(`/api/files/${projectId}/${path}`);
  const data = await res.json();
  return data.content || '';
}

export async function saveFile(projectId: string, path: string, content: string): Promise<void> {
  await fetch(`/api/files/${projectId}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
}
