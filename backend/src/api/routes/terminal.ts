import { Router } from 'express';
import { ContainerManager } from '../../sandbox/container-manager';

const router = Router();
const containers = new ContainerManager();

router.post('/:sessionId/exec', async (req, res) => {
  try {
    const { command } = req.body;
    const result = await containers.execCommand(req.params.sessionId, command);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as terminalRoutes };
