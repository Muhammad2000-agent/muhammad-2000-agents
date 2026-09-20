export interface Agent {
  id: string; // e.g. "AGT-0001"
  number: number; // 1 to 2000
  name: string;
  domain: string;
  domainId: string;
  specialization: string;
  systemPrompt: string;
  capabilities: string[];
  status: 'ready' | 'busy' | 'active';
  efficiencyScore: number;
  tags: string[];
  samplePrompt: string;
  samplePromptUrdu: string;
  languageSupport: string[];
  icon: string;
}

export interface DomainCategory {
  id: string;
  name: string;
  urduName: string;
  icon: string;
  agentCount: number;
  range: [number, number];
  description: string;
  color: string;
}

export interface HiveToolUsage {
  toolName: string;
  label: string;
  icon: string;
  details: string;
  status: 'completed' | 'active';
}

export interface SpawnedAgent {
  id: string; // e.g. "AGT-2001"
  name: string;
  specialization: string;
  role: string;
  reasonSpawned: string;
}

export interface HiveCollaborator {
  id: string;
  name: string;
  domain: string;
  role: string;
  contribution: string;
}

export interface HiveCommunityStep {
  phase: string;
  title: string;
  agent: string;
  description: string;
}

export interface HiveTaskMessage {
  id: string;
  role: 'user' | 'community';
  prompt: string;
  result?: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  mobilizedAgents?: HiveCollaborator[];
  spawnedAgents?: SpawnedAgent[];
  toolsUsed?: HiveToolUsage[];
  communitySteps?: HiveCommunityStep[];
  durationMs?: number;
  errorMessage?: string;
}

export interface TaskExecution {
  id: string;
  agentId: string;
  agentName: string;
  domain: string;
  taskPrompt: string;
  languagePreference: 'auto' | 'roman-urdu' | 'urdu' | 'english';
  status: 'running' | 'completed' | 'failed';
  output: string;
  durationMs: number;
  timestamp: string;
  mode: 'single' | 'swarm';
}

export interface SwarmPhase {
  agentId: string;
  agentName: string;
  role: string;
  contribution: string;
}

export interface SwarmExecution {
  id: string;
  taskPrompt: string;
  agents: Agent[];
  steps: SwarmPhase[];
  finalOutput: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  durationMs: number;
}
