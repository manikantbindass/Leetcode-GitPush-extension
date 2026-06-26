import type { AIRequestOptions, AIResponse } from '@/types/ai';
import { BaseAIProvider } from './base';

export class OllamaProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: ConstructorParameters<typeof BaseAIProvider>[0]) {
    super(config);
    this.baseUrl = (config.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    this.model = config.model ?? 'codellama';
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        stream: false,
        options: {
          num_predict: options.maxTokens ?? 8000,
          temperature: options.temperature ?? 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}: ${response.statusText}. Is Ollama running at ${this.baseUrl}?`);
    }

    const data = await response.json();
    return { content: data.message?.content ?? '' };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
