import fs from 'fs/promises';
import path from 'path';

export interface StarterTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
}

export const starterTemplates: StarterTemplate[] = [];

export async function scaffoldStarterProject(projectPath: string, _template: string): Promise<void> {
  await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify({
    name: path.basename(projectPath),
    version: '0.1.0',
    private: true,
  }, null, 2));
  await fs.writeFile(path.join(projectPath, 'index.html'), '<div id="root"></div>\n');
}
