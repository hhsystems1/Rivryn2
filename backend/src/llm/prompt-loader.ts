import fs from 'fs/promises';
import path from 'path';

export class PromptLoader {
  private promptsPath: string;

  constructor() {
    this.promptsPath = path.join(process.cwd(), '..', 'rivryn-prompts');
  }

  async load(agentPath: string): Promise<string> {
    const fullPath = path.join(this.promptsPath, `${agentPath}.md`);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch {
      return '';
    }
  }
}
