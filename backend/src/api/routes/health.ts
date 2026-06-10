import { Router } from 'express';
import Docker from 'dockerode';
import { createProvider } from '../../llm/provider-factory';

const router = Router();
const docker = new Docker();

router.get('/', async (_req, res) => {
  const llm = createProvider();
  const [dockerStatus, llmStatus] = await Promise.all([checkDockerHealth(), llm.checkHealth()]);

  const ready = dockerStatus.connected && llmStatus.connected && llmStatus.modelAvailable;
  const status = ready ? 'ready' : 'degraded';

  res.status(ready ? 200 : 503).json({
    status,
    checks: {
      docker: dockerStatus,
      llm: llmStatus
    }
  });
});

async function checkDockerHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    await docker.ping();
    return { connected: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      error: `Docker unavailable: ${message}`
    };
  }
}

export { router as healthRoutes };
