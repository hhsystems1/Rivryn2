import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const PROJECTS_ROOT = process.env.PROJECTS_ROOT || './projects';

router.get('/:projectId/*', async (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_ROOT, req.params.projectId);
    const filePath = path.join(projectPath, req.params[0] || '');
    
    // Ensure project directory exists
    await fs.mkdir(projectPath, { recursive: true });
    
    const stat = await fs.stat(filePath).catch(() => null);
    
    if (!stat) {
      // Return empty directory listing if path doesn't exist yet
      return res.json({ items: [] });
    }
    
    if (stat.isDirectory()) {
      const entries = await fs.readdir(filePath, { withFileTypes: true });
      const items = entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        path: path.join(req.params[0] || '', e.name)
      }));
      res.json({ items });
    } else {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({ content });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:projectId/*', async (req, res) => {
  try {
    const filePath = path.join(PROJECTS_ROOT, req.params.projectId, req.params[0] || '');
    await fs.writeFile(filePath, req.body.content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:projectId/*', async (req, res) => {
  try {
    const filePath = path.join(PROJECTS_ROOT, req.params.projectId, req.params[0] || '');
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as fileRoutes };
