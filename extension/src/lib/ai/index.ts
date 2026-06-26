import type { AIProviderConfig } from '@/types/ai';
import { BaseAIProvider } from './base';
import { DeepSeekProvider } from './deepseek';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { CustomProvider } from './custom';

export function createProvider(config: AIProviderConfig): BaseAIProvider {
  switch (config.type) {
    case 'deepseek': return new DeepSeekProvider(config);
    case 'openai':   return new OpenAIProvider(config);
    case 'claude':   return new ClaudeProvider(config);
    case 'gemini':   return new GeminiProvider(config);
    case 'ollama':   return new OllamaProvider(config);
    case 'custom':   return new CustomProvider(config);
    default:
      throw new Error(`Unknown AI provider type: ${(config as AIProviderConfig).type}`);
  }
}

export const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    type: 'deepseek',
    name: 'DeepSeek Coder',
    model: 'deepseek-chat',
    enabled: false,
  },
  {
    type: 'openai',
    name: 'OpenAI GPT-4o',
    model: 'gpt-4o',
    enabled: false,
  },
  {
    type: 'claude',
    name: 'Claude 3.5 Sonnet',
    model: 'claude-3-5-sonnet-20241022',
    enabled: false,
  },
  {
    type: 'gemini',
    name: 'Gemini 1.5 Pro',
    model: 'gemini-1.5-pro',
    enabled: false,
  },
  {
    type: 'ollama',
    name: 'Ollama (Local)',
    model: 'codellama',
    baseUrl: 'http://localhost:11434',
    enabled: false,
  },
];

export { BaseAIProvider } from './base';
export { DeepSeekProvider } from './deepseek';
export { OpenAIProvider } from './openai';
export { ClaudeProvider } from './claude';
export { GeminiProvider } from './gemini';
export { OllamaProvider } from './ollama';
export { CustomProvider } from './custom';
