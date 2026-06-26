export type AIProviderType = 'deepseek' | 'openai' | 'claude' | 'gemini' | 'ollama' | 'custom';

export interface AIProviderConfig {
  type: AIProviderType;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}

export interface SolutionMap {
  [language: string]: string;
}

export interface ComplexityInfo {
  time: string;
  space: string;
}

export interface GenerationResult {
  solutions: SolutionMap;
  complexity: ComplexityInfo;
  explanation: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
