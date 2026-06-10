import { Router } from 'express';
import { createProvider } from '../../llm/provider-factory';
import { PromptLoader } from '../../llm/prompt-loader';

const router = Router();
const prompts = new PromptLoader();

router.post('/execute', async (req, res) => {
  try {
    const { agent, task, context, provider } = req.body;
    const llm = createProvider(provider);
    const prompt = await prompts.load(agent);
    const result = await llm.generate(prompt, task, context);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/plan', async (req, res) => {
  try {
    const { goal, provider } = req.body;
    const llm = createProvider(provider);
    const plannerPrompt = await prompts.load('orchestrator/planner');
    const plan = await llm.generate(plannerPrompt, goal);
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as agentRoutes };
