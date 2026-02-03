import WebSocket from 'ws';
import { spawn, ChildProcess } from 'child_process';
import { ContainerManager } from './container-manager';

export class TerminalSessionManager {
  private sessions: Map<string, ChildProcess> = new Map();
  private containerManager: ContainerManager;

  constructor() {
    this.containerManager = new ContainerManager();
  }

  handleConnection(ws: WebSocket, sessionId: string): void {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const child = spawn(shell, [], {
      env: process.env,
      cwd: process.cwd()
    });

    this.sessions.set(sessionId, child);

    child.stdout?.on('data', (data) => {
      ws.send(data.toString());
    });

    child.stderr?.on('data', (data) => {
      ws.send(data.toString());
    });

    child.on('exit', () => {
      ws.close();
      this.sessions.delete(sessionId);
    });

    ws.on('message', (data) => {
      child.stdin?.write(data.toString());
    });

    ws.on('close', () => {
      child.kill();
      this.sessions.delete(sessionId);
    });
  }
}
