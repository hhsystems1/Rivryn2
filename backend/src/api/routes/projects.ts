import { Router } from 'express';
import { ContainerManager } from '../../sandbox/container-manager';

const router = Router();
const containers = new ContainerManager();

router.post('/create', async (req, res) => {
  try {
    const { name, template } = req.body;
    const project = await containers.createProject(name, template);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/list', async (_req, res) => {
  try {
    const projects = await containers.listProjects();
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await containers.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as projectRoutes };
