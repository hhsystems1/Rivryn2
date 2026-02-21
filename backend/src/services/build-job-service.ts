import { randomUUID } from 'crypto';
import { OllamaClient } from '../llm/ollama-client';
import { PromptLoader } from '../llm/prompt-loader';
import {
  BuildArtifact,
  BuildJob,
  BuildJobCreateRequest,
  BuildJobLogEntry,
  BuildJobStatus
} from '../types';

const DEFAULT_MAX_RETRIES = 1;
const MAX_LIST_RESULTS = 100;

export class BuildJobService {
  private readonly jobs = new Map<string, BuildJob>();
  private readonly queue: string[] = [];
  private readonly ollama: OllamaClient;
  private readonly prompts: PromptLoader;
  private processing = false;

  constructor(ollama = new OllamaClient(), prompts = new PromptLoader()) {
    this.ollama = ollama;
    this.prompts = prompts;
  }

  createJob(input: BuildJobCreateRequest): BuildJob {
    const now = new Date().toISOString();
    const maxRetries = this.normalizeRetryCount(input.maxRetries);
    const job: BuildJob = {
      id: randomUUID(),
      apiVersion: 'v1',
      status: 'queued',
      input: {
        projectName: input.projectName,
        prompt: input.prompt,
        template: input.template,
        context: input.context,
        requestedBy: input.requestedBy,
        maxRetries
      },
      attemptCount: 0,
      logs: [],
      artifacts: [],
      createdAt: now,
      updatedAt: now
    };

    this.jobs.set(job.id, job);
    this.queue.push(job.id);
    void this.processQueue();

    return this.cloneJob(job);
  }

  getJob(jobId: string): BuildJob | null {
    const job = this.jobs.get(jobId);
    return job ? this.cloneJob(job) : null;
  }

  listJobs(limit = 20): BuildJob[] {
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIST_RESULTS);
    return [...this.jobs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, safeLimit)
      .map((job) => this.cloneJob(job));
  }

  private normalizeRetryCount(maxRetries?: number): number {
    if (maxRetries === undefined) {
      return DEFAULT_MAX_RETRIES;
    }
    if (!Number.isFinite(maxRetries)) {
      return DEFAULT_MAX_RETRIES;
    }
    return Math.min(Math.max(Math.trunc(maxRetries), 0), 5);
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const nextId = this.queue.shift();
        if (!nextId) {
          continue;
        }
        const job = this.jobs.get(nextId);
        if (!job || job.status !== 'queued') {
          continue;
        }
        await this.runJob(job);
      }
    } finally {
      this.processing = false;
    }
  }

  private async runJob(job: BuildJob): Promise<void> {
    this.updateStatus(job, 'running');

    const retries = job.input.maxRetries ?? DEFAULT_MAX_RETRIES;
    const maxAttempts = Math.max(retries + 1, 1);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      job.attemptCount = attempt;
      this.appendLog(job, 'info', `Starting generation attempt ${attempt}/${maxAttempts}`);
      try {
        await this.executeGeneration(job);
        this.appendLog(job, 'info', 'Build generation completed');
        this.updateStatus(job, 'completed');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown generation error';
        job.error = message;
        this.appendLog(job, 'error', message);
      }
    }

    this.updateStatus(job, 'failed');
  }

  private async executeGeneration(job: BuildJob): Promise<void> {
    const plannerPrompt = await this.prompts.load('orchestrator/planner');
    const plannerSystem = plannerPrompt || 'You are a planner that creates concise build plans.';

    this.appendLog(job, 'info', 'Planning app generation steps');
    const plan = await this.ollama.generate(plannerSystem, job.input.prompt, job.input.context);
    this.pushArtifact(job, 'plan', plan, { generator: 'planner' });

    const coderPrompt = await this.prompts.load('agents/coder');
    const coderSystem = coderPrompt || 'You are a coding agent that outputs implementation instructions.';

    this.appendLog(job, 'info', 'Drafting implementation instructions');
    const specification = await this.ollama.generate(
      coderSystem,
      [
        `Project name: ${job.input.projectName}`,
        job.input.template ? `Template: ${job.input.template}` : '',
        `User request: ${job.input.prompt}`,
        `Plan:\n${plan}`
      ]
        .filter(Boolean)
        .join('\n\n'),
      job.input.context
    );

    this.pushArtifact(job, 'specification', specification, { generator: 'coder' });
  }

  private pushArtifact(
    job: BuildJob,
    kind: BuildArtifact['kind'],
    content: string,
    metadata?: Record<string, string>
  ): void {
    job.artifacts.push({
      id: randomUUID(),
      kind,
      content,
      metadata,
      createdAt: new Date().toISOString()
    });
    job.updatedAt = new Date().toISOString();
  }

  private updateStatus(job: BuildJob, status: BuildJobStatus): void {
    job.status = status;
    job.updatedAt = new Date().toISOString();
  }

  private appendLog(job: BuildJob, level: BuildJobLogEntry['level'], message: string): void {
    job.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message
    });
    job.updatedAt = new Date().toISOString();
  }

  private cloneJob(job: BuildJob): BuildJob {
    return JSON.parse(JSON.stringify(job)) as BuildJob;
  }
}
