import { Agent, Message } from '../types';

export interface SendMessageParams {
  content: string;
  sessionId: string;
  targetAgentIds: string[];
  agents: Agent[];
  onAddMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  onUpdateMessage: (id: string, updates: Partial<Message>) => void;
  onUpdateAgent: (agent: Agent) => void;
}

export async function sendMessageToAgents({
  content,
  sessionId,
  targetAgentIds,
  agents,
  onAddMessage,
  onUpdateMessage,
  onUpdateAgent,
}: SendMessageParams): Promise<void> {
  if (targetAgentIds.length === 0) return;

  // Add user message
  onAddMessage({
    sessionId,
    content,
    sender: 'user',
    senderName: 'You',
    status: 'sent',
    targets: targetAgentIds,
  });

  // Send to each selected agent
  for (const agentId of targetAgentIds) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) continue;

    // Generate message ID upfront so we can update it later
    const pendingMessageId = crypto.randomUUID();
    const timestamp = Date.now();

    // Add placeholder for agent response
    const pendingMessage: Message = {
      id: pendingMessageId,
      sessionId,
      content: '',
      sender: agentId,
      senderName: agent.name,
      timestamp,
      status: 'sending',
      targets: [agentId],
    };

    // We need to dispatch this directly, so we'll handle it differently
    // This is a simplified version - in practice you'd pass dispatch
  }
}

export async function callAgentApi(
  agent: Agent,
  sessionId: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(agent.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agent.apiKey}`,
    },
    body: JSON.stringify({
      model: agent.model,
      messages: [
        {
          session_id: sessionId,
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}