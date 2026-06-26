import type { AIRequestOptions, AIResponse } from '@/types/ai';
import { BaseAIProvider } from './base';

export class ClaudeProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: ConstructorParameters<typeof BaseAIProvider>[0]) {
    super(config);
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1';
    this.model = config.model ?? 'claude-3-5-sonnet-20241022';
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) throw new Error('Anthropic API key is required');

    // Anthropic separates system prompt from messages
    const systemMsg = options.messages.find(m => m.role === 'system');
    const userMessages = options.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options.maxTokens ?? 8000,
      messages: userMessages,
    };
    if (systemMsg) body.system = systemMsg.content;

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Anthropic API error ${response.status}: ${err?.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';
    return {
      content,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
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
