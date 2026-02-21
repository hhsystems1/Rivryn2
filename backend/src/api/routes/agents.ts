import { Router } from 'express';
import { OllamaClient } from '../../llm/ollama-client';
import { PromptLoader } from '../../llm/prompt-loader';

const router = Router();
const ollama = new OllamaClient();
const prompts = new PromptLoader();

router.post('/execute', async (req, res) => {
  try {
    const { agent, task, context } = req.body;
    const prompt = await prompts.load(agent);
    const result = await ollama.generate(prompt, task, context);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/plan', async (req, res) => {
  try {
    const { goal } = req.body;
    const plannerPrompt = await prompts.load('orchestrator/planner');
    const plan = await ollama.generate(plannerPrompt, goal);
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as agentRoutes };
