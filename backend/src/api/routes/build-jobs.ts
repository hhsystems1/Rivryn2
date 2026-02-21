import { Router } from 'express';
import { BuildJobService } from '../../services/build-job-service';
import { BuildJobCreateRequest } from '../../types';

const router = Router();
const buildJobs = new BuildJobService();

router.post('/v1', (req, res) => {
  const validation = validateCreateRequest(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const job = buildJobs.createJob(validation.value);
  res.status(202).json({ job });
});

router.get('/v1/:id', (req, res) => {
  const job = buildJobs.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: `Unknown job id: ${req.params.id}` });
  }
  res.json({ job });
});

router.get('/v1', (req, res) => {
  const limit = parseLimit(req.query.limit);
  const jobs = buildJobs.listJobs(limit);
  res.json({ jobs });
});

function validateCreateRequest(body: unknown):
  | { ok: true; value: BuildJobCreateRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const payload = body as Partial<BuildJobCreateRequest>;

  if (payload.apiVersion !== 'v1') {
    return { ok: false, error: "apiVersion must be 'v1'" };
  }
  if (!payload.projectName || typeof payload.projectName !== 'string') {
    return { ok: false, error: 'projectName is required and must be a string' };
  }
  if (!payload.prompt || typeof payload.prompt !== 'string') {
    return { ok: false, error: 'prompt is required and must be a string' };
  }
  if (payload.template !== undefined && typeof payload.template !== 'string') {
    return { ok: false, error: 'template must be a string' };
  }
  if (payload.context !== undefined && typeof payload.context !== 'string') {
    return { ok: false, error: 'context must be a string' };
  }
  if (payload.requestedBy !== undefined && typeof payload.requestedBy !== 'string') {
    return { ok: false, error: 'requestedBy must be a string' };
  }
  if (payload.maxRetries !== undefined && typeof payload.maxRetries !== 'number') {
    return { ok: false, error: 'maxRetries must be a number' };
  }

  return {
    ok: true,
    value: {
      apiVersion: 'v1',
      projectName: payload.projectName.trim(),
      prompt: payload.prompt.trim(),
      template: payload.template?.trim(),
      context: payload.context,
      requestedBy: payload.requestedBy?.trim(),
      maxRetries: payload.maxRetries
    }
  };
}

function parseLimit(raw: unknown): number {
  if (!raw || Array.isArray(raw)) {
    return 20;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return 20;
  }
  return Math.trunc(value);
}

export { router as buildJobRoutes };
