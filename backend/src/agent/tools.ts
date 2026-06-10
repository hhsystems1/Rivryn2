import fs from 'fs/promises';
import path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { ToolDefinition, ToolCall } from '../llm/types';

const execAsync = promisify(execCallback);
const FILES_ROOT = process.env.FILES_ROOT || './files';

export const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file (creates parent directories if needed)',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'File content' }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and directories in a folder',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path relative to project root' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file or directory',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File or directory path relative to project root' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'exec_command',
      description: 'Execute a terminal command in the project workspace',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' }
        },
        required: ['command']
      }
    }
  }
];

export interface ToolResult {
  success: boolean;
  output: string;
}

const SENSITIVE_COMMAND_PATTERNS = [
  /^rm\s+-rf\s+/i,
  /^sudo\s+/i,
  /^drop\s+(table|database)\s+/i,
  /^delete\s+from\s+/i,
  /^truncate\s+/i,
  /^format\s+/i,
  /^mkfs/i,
  /^dd\s+/i,
  /^shutdown/i,
  /^reboot/i,
  /^chmod\s+777/i
];

export function isSensitiveToolCall(call: ToolCall): boolean {
  if (call.name === 'delete_file') return true;
  if (call.name === 'exec_command') {
    const cmd = (call.arguments.command as string) || '';
    return SENSITIVE_COMMAND_PATTERNS.some((p) => p.test(cmd));
  }
  return false;
}

export async function executeToolCall(
  call: ToolCall,
  projectId: string
): Promise<ToolResult> {
  const projectRoot = path.join(FILES_ROOT, projectId);

  try {
    switch (call.name) {
      case 'read_file': {
        const filePath = path.join(projectRoot, call.arguments.path as string);
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, output: content };
      }

      case 'write_file': {
        const filePath = path.join(projectRoot, call.arguments.path as string);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, call.arguments.content as string, 'utf-8');
        return { success: true, output: `Wrote ${call.arguments.path}` };
      }

      case 'list_files': {
        const dirPath = path.join(projectRoot, (call.arguments.path as string) || '');
        await fs.mkdir(dirPath, { recursive: true });
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const items = entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file'
        }));
        return { success: true, output: JSON.stringify(items, null, 2) };
      }

      case 'delete_file': {
        const filePath = path.join(projectRoot, call.arguments.path as string);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await fs.rm(filePath, { recursive: true, force: true });
        } else {
          await fs.unlink(filePath);
        }
        return { success: true, output: `Deleted ${call.arguments.path}` };
      }

      case 'exec_command': {
        const command = call.arguments.command as string;
        const { stdout, stderr } = await execAsync(command, {
          cwd: projectRoot,
          timeout: 60000,
          maxBuffer: 1024 * 1024
        });
        const output = stdout + (stderr ? `\nstderr:\n${stderr}` : '');
        return { success: true, output: output || '(no output)' };
      }

      default:
        return { success: false, output: `Unknown tool: ${call.name}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, output: `Error executing ${call.name}: ${message}` };
  }
}
