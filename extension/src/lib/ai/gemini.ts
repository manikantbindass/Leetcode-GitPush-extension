import type { AIRequestOptions, AIResponse } from '@/types/ai';
import { BaseAIProvider } from './base';

export class GeminiProvider extends BaseAIProvider {
  private model: string;

  constructor(config: ConstructorParameters<typeof BaseAIProvider>[0]) {
    super(config);
    this.model = config.model ?? 'gemini-1.5-pro';
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    if (!this.config.apiKey) throw new Error('Gemini API key is required');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.config.apiKey}`;

    // Map messages to Gemini format
    const systemMsg = options.messages.find(m => m.role === 'system');
    const userMessages = options.messages.filter(m => m.role !== 'system');

    const contents = userMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 8000,
        temperature: options.temperature ?? 0.1,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error ${response.status}: ${err?.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { content };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat({ messages: [{ role: 'user', content: 'Say ok.' }], maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}
