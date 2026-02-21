export interface AgentTask {
  id: string;
  agent: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface AgentPlan {
  goal: string;
  steps: AgentTask[];
}

export interface Project {
  id: string;
  name: string;
  containerId?: string;
  template?: string;
  status: 'creating' | 'running' | 'stopped';
  warning?: string;
  createdAt: Date;
}

export type BuildJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface BuildJobCreateRequest {
  apiVersion: 'v1';
  projectName: string;
  prompt: string;
  template?: string;
  context?: string;
  requestedBy?: string;
  maxRetries?: number;
}

export interface BuildJobLogEntry {
  timestamp: string;
  level: 'info' | 'error';
  message: string;
}

export interface BuildArtifact {
  id: string;
  kind: 'plan' | 'specification' | 'source' | 'manifest';
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface BuildJob {
  id: string;
  apiVersion: 'v1';
  status: BuildJobStatus;
  input: Omit<BuildJobCreateRequest, 'apiVersion'>;
  attemptCount: number;
  logs: BuildJobLogEntry[];
  artifacts: BuildArtifact[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}
