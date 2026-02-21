import { Router } from 'express';
import Docker from 'dockerode';
import { OllamaClient } from '../../llm/ollama-client';

const router = Router();
const ollama = new OllamaClient();
const docker = new Docker();

router.get('/', async (_req, res) => {
  const [dockerStatus, ollamaStatus] = await Promise.all([checkDockerHealth(), ollama.checkHealth()]);

  const ready = dockerStatus.connected && ollamaStatus.connected && ollamaStatus.modelAvailable;
  const status = ready ? 'ready' : 'degraded';

  res.status(ready ? 200 : 503).json({
    status,
    checks: {
      docker: dockerStatus,
      ollama: ollamaStatus
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
