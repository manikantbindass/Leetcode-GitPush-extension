import type { AIRequestOptions, AIResponse } from '@/types/ai';
import { BaseAIProvider } from './base';

export class DeepSeekProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: ConstructorParameters<typeof BaseAIProvider>[0]) {
    super(config);
    this.baseUrl = config.baseUrl ?? 'https://api.deepseek.com/v1';
    // deepseek-chat is the current general-purpose model (handles code well)
    // deepseek-coder is the older coding-specific model
    this.model = config.model ?? 'deepseek-chat';
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) throw new Error('DeepSeek API key is required');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
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
      throw new Error(`DeepSeek API error ${response.status}: ${err?.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content ?? '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat({
        messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}
