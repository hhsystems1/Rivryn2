import { Router, Request, Response } from 'express';
import { executeAgent, resolveApproval } from './agent-executor';

const router = Router();

router.post('/run', (req: Request, res: Response) => {
  const { prompt, projectId, provider, sessionId } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required and must be a string' });
  }
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'projectId is required and must be a string' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const run = async () => {
    try {
      const generator = executeAgent(prompt, projectId, provider, sessionId);

      for await (const event of generator) {
        const data = JSON.stringify(event);
        res.write(`data: ${data}\n\n`);

        if (event.type === 'complete' || event.type === 'error') {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  run();

  req.on('close', () => {
    if (!res.writableEnded) {
      res.end();
    }
  });
});

router.post('/approve', (req: Request, res: Response) => {
  const { sessionId, callId, approved } = req.body;

  if (!sessionId || !callId || approved === undefined) {
    return res.status(400).json({ error: 'sessionId, callId, and approved are required' });
  }

  const found = resolveApproval(sessionId, callId, approved);
  if (!found) {
    return res.status(404).json({ error: 'No pending approval found for that call' });
  }

  res.json({ success: true });
});

export { router as agentRunRoutes };
