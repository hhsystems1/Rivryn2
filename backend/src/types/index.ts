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
  status: 'creating' | 'running' | 'stopped';
  createdAt: Date;
}
