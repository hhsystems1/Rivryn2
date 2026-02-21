import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const FILES_ROOT = process.env.FILES_ROOT || './files';

// List files at root or specific path
router.get('/*', async (req, res) => {
  try {
    const filePath = path.join(FILES_ROOT, (req.params as { [key: string]: string })['0'] || '');
    
    // Ensure files directory exists
    await fs.mkdir(FILES_ROOT, { recursive: true });
    
    const stat = await fs.stat(filePath).catch(() => null);
    
    if (!stat) {
      return res.json({ items: [] });
    }
    
    if (stat.isDirectory()) {
      const entries = await fs.readdir(filePath, { withFileTypes: true });
      const items = entries
      .map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        path: path.join((req.params as { [key: string]: string })['0'] || '', e.name)
      }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      res.json({ items });
    } else {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({ content });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Save file
router.post('/*', async (req, res) => {
  try {
    const filePath = path.join(FILES_ROOT, (req.params as { [key: string]: string })['0'] || '');
    const type = req.body?.type as 'file' | 'directory' | undefined;

    if (type === 'directory') {
      await fs.mkdir(filePath, { recursive: true });
      return res.json({ success: true });
    }

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, req.body.content ?? '', 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Delete file
router.delete('/*', async (req, res) => {
  try {
    const filePath = path.join(FILES_ROOT, (req.params as { [key: string]: string })['0'] || '');
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as fileRoutes };
