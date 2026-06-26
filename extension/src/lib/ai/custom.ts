import type { AIRequestOptions, AIResponse } from '@/types/ai';
import { BaseAIProvider } from './base';

export class CustomProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: ConstructorParameters<typeof BaseAIProvider>[0]) {
    super(config);
    if (!config.baseUrl) throw new Error('Custom provider requires a base URL');
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.model = config.model ?? 'custom-model';
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        max_tokens: options.maxTokens ?? 8000,
        temperature: options.temperature ?? 0.1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Custom API error ${response.status}: ${err?.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content ?? data.message?.content ?? '',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat({ messages: [{ role: 'user', content: 'Say ok.' }], maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
