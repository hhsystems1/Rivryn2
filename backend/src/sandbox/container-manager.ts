import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import { Project } from '../types';
import { scaffoldStarterProject } from '../projects/starter-templates';

export class ContainerManager {
  private docker: Docker;
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.docker = new Docker();
  }

  async createProject(name: string, template = 'react-ts'): Promise<Project> {
    const id = `rivryn-${name}-${Date.now()}`;
    const projectPath = path.join(process.cwd(), 'files', id);
    await fs.mkdir(projectPath, { recursive: true });
    await scaffoldStarterProject(projectPath, template);

    const project: Project = {
      id,
      name,
      template,
      status: 'stopped',
      createdAt: new Date()
    };

    try {
      const container = await this.docker.createContainer({
        Image: 'rivryn-base:latest',
        name: id,
        HostConfig: {
          Binds: [`${projectPath}:/workspace`],
          PortBindings: { '3000/tcp': [{ HostPort: '0' }] },
          Memory: 512 * 1024 * 1024,
          CpuQuota: 50000
        },
        WorkingDir: '/workspace',
        Cmd: ['sleep', 'infinity']
      });

      await container.start();
      project.containerId = container.id;
      project.status = 'running';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      project.warning = `Container unavailable: ${message}`;
    }

    this.projects.set(id, project);
    return project;
  }

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async deleteProject(id: string): Promise<void> {
    const project = this.projects.get(id);
    if (project?.containerId) {
      const container = this.docker.getContainer(project.containerId);
      await container.stop().catch(() => {});
      await container.remove().catch(() => {});
    }
    this.projects.delete(id);
  }

  async execCommand(sessionId: string, command: string): Promise<{ output: string }> {
    const project = this.projects.get(sessionId);
    if (!project?.containerId) {
      throw new Error('Project not found');
    }

    const container = this.docker.getContainer(project.containerId);
    const exec = await container.exec({
      Cmd: ['sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({});
    let output = '';

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      stream.on('end', () => resolve({ output }));
      stream.on('error', reject);
    });
  }
}
