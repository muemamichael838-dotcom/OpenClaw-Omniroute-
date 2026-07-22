export interface StackConfig {
  appName: string;
  region: string;
  memoryMb: number;
  cpuKind: 'shared' | 'performance';
  cpus: number;
  volumeName: string;
  volumeSizeGb: number;
  mountPath: string;
  gatewayPort: number;
  omniroutePort: number;
  redisPort: number;
  gatewayToken: string;
  nodeVersion: string;
  autoStop: 'suspend' | 'off' | 'stop';
  minMachinesRunning: number;
  openAiApiKey?: string;
  geminiApiKey?: string;
  anthropicApiKey?: string;
  groqApiKey?: string;
  openRouterApiKey?: string;
}

export interface GeneratedFile {
  id: string;
  path: string;
  filename: string;
  language: string;
  description: string;
  content: string;
  isCustomized?: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface SimulationRequest {
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'mistral';
  model: string;
  prompt: string;
  useCache: boolean;
  maxTokens: number;
}

export interface SimulationResponse {
  id: string;
  provider: string;
  model: string;
  output: string;
  latencyMs: number;
  cached: boolean;
  redisKeysCount: number;
  bytesProcessed: number;
  timestamp: string;
}

export type ActiveTab = 'configurator' | 'topology' | 'wizard' | 'sandbox' | 'ai-advisor';
