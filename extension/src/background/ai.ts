import type { AIProviderConfig } from '@/types/ai';
import type { GenerationResult } from '@/types/ai';
import type { OutputLanguage, Submission } from '@/types/submission';
import { createProvider } from '@/lib/ai/index';
import * as storage from '@/lib/storage';
import { retry } from '@/lib/utils';

export async function getActiveProviderConfig(): Promise<AIProviderConfig | null> {
  const [providers, activeType] = await Promise.all([
    storage.get('providers'),
    storage.get('activeProvider'),
  ]);
  if (!providers?.length || !activeType) return null;
  // Don't require enabled:true — activeProvider already identifies the chosen provider
  return providers.find(p => p.type === activeType) ?? null;
}

export async function generateSolutions(
  submission: Submission,
  targetLanguages: OutputLanguage[]
): Promise<GenerationResult> {
  const config = await getActiveProviderConfig();
  if (!config) {
    throw new Error(
      'No active AI provider configured. Please add an API key in Settings → AI Provider.'
    );
  }
  if (!config.apiKey && config.type !== 'ollama') {
    throw new Error(
      `No API key set for ${config.name}. Please add it in Settings → AI Provider.`
    );
  }

  const provider = createProvider(config);

  return retry(
    () => provider.generateSolutions(submission, targetLanguages),
    { maxAttempts: 3, delay: 2000, backoff: 2 }
  );
}

export async function testProvider(
  config: AIProviderConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = createProvider(config);
    const ok = await provider.testConnection();
    return { success: ok };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
