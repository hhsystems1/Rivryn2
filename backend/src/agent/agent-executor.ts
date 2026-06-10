import { LLMProvider, LLMResponse, ToolCall } from '../llm/types';
import { createProvider } from '../llm/provider-factory';
import { PromptLoader } from '../llm/prompt-loader';
import { TOOLS, executeToolCall, isSensitiveToolCall } from './tools';

const MAX_TOOL_CALLS = 25;

export type AgentEvent =
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; call: ToolCall }
  | { type: 'tool_result'; call: ToolCall; result: { success: boolean; output: string } }
  | { type: 'pending_approval'; callId: string; call: ToolCall }
  | { type: 'approved'; callId: string }
  | { type: 'rejected'; callId: string }
  | { type: 'complete'; summary: string }
  | { type: 'error'; message: string };

interface SessionState {
  pendingApprovals: Map<string, { resolve: (approved: boolean) => void }>;
}

const sessions = new Map<string, SessionState>();

export function getSessionState(sessionId: string): SessionState {
  let state = sessions.get(sessionId);
  if (!state) {
    state = { pendingApprovals: new Map() };
    sessions.set(sessionId, state);
  }
  return state;
}

export function resolveApproval(sessionId: string, callId: string, approved: boolean): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  const pending = session.pendingApprovals.get(callId);
  if (!pending) return false;
  pending.resolve(approved);
  session.pendingApprovals.delete(callId);
  return true;
}

export async function* executeAgent(
  userPrompt: string,
  projectId: string,
  providerName?: string,
  sessionId?: string
): AsyncGenerator<AgentEvent> {
  sessionId = sessionId || `${projectId}-${Date.now()}`;
  let llm: LLMProvider;
  try {
    llm = createProvider(providerName);
  } catch (error) {
    yield { type: 'error', message: `Failed to create provider: ${error}` };
    return;
  }

  const prompts = new PromptLoader();
  const plannerPrompt = await prompts.load('orchestrator/planner');
  const coderPrompt = await prompts.load('agents/coder');
  const systemPrompt = [
    plannerPrompt || 'You are a planning assistant that creates step-by-step plans.',
    '',
    'You have access to tools that let you read and write files, list directories, and execute commands.',
    'When you need to perform an action, use the appropriate tool rather than describing what to do.',
    coderPrompt ? `\nCoding guidelines:\n${coderPrompt}` : '',
    '\nALWAYS use tools to perform actions. Do not just describe what to do.'
  ].join('\n');

  const session = getSessionState(sessionId);
  let toolCallCount = 0;
  const conversation: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }[] = [];

  yield { type: 'thinking', content: 'Analyzing request and creating a plan...' };

  let response: LLMResponse;
  try {
    response = await llm.generateWithTools(systemPrompt, userPrompt, TOOLS);
  } catch (error) {
    yield { type: 'error', message: `LLM request failed: ${error}` };
    return;
  }

  while (true) {
    if (response.type === 'text') {
      const content = response.content.trim();
      if (content) {
        yield { type: 'thinking', content };
        conversation.push({ role: 'assistant', content });
      }

      yield { type: 'complete', summary: content || 'Task completed.' };
      return;
    }

    if (response.type === 'tool_calls') {
      if (response.calls.length === 0) {
        yield { type: 'complete', summary: 'No actions needed.' };
        return;
      }

      for (const call of response.calls) {
        toolCallCount++;
        if (toolCallCount > MAX_TOOL_CALLS) {
          yield { type: 'error', message: `Exceeded maximum of ${MAX_TOOL_CALLS} tool calls. Stopping.` };
          return;
        }

        yield { type: 'tool_call', call };
        conversation.push({ role: 'assistant', content: JSON.stringify({ tool_call: call.name, args: call.arguments }) });

        if (isSensitiveToolCall(call)) {
          yield { type: 'pending_approval', callId: call.id, call };

          const approved = await new Promise<boolean>((resolve) => {
            session.pendingApprovals.set(call.id, { resolve });
          });

          if (!approved) {
            yield { type: 'rejected', callId: call.id };
            conversation.push({
              role: 'tool',
              content: `Tool call ${call.name} was rejected by the user. Adjust your approach.`,
              tool_call_id: call.id
            });
            continue;
          }
          yield { type: 'approved', callId: call.id };
        }

        const result = await executeToolCall(call, projectId);
        yield { type: 'tool_result', call, result };
        conversation.push({
          role: 'tool',
          content: result.output,
          tool_call_id: call.id
        });
      }

      const lastUserMsg = conversation.filter((m) => m.role === 'user').pop();
      const userMsg = lastUserMsg?.content || 'Continue with the next step.';

      try {
        response = await llm.generateWithTools(systemPrompt, userMsg, TOOLS, conversation);
      } catch (error) {
        yield { type: 'error', message: `LLM request failed during tool loop: ${error}` };
        return;
      }
    }
  }
}
