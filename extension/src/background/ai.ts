import type { AIProviderConfig } from '@/types/ai';
import type { GenerationResult } from '@/types/ai';
import type { OutputLanguage, Submission } from '@/types/submission';
import { createProvider } from '@/lib/ai/index';
import * as storage from '@/lib/storage';
import { retry, sleep } from '@/lib/utils';

export async function getActiveProviderConfig(): Promise<AIProviderConfig | null> {
  const [providers, activeType] = await Promise.all([
    storage.get('providers'),
    storage.get('activeProvider'),
  ]);
  if (!providers?.length || !activeType) return null;
  return providers.find(p => p.type === activeType && p.enabled) ?? null;
}

export async function generateSolutions(
  submission: Submission,
  targetLanguages: OutputLanguage[]
): Promise<GenerationResult> {
  const config = await getActiveProviderConfig();
  if (!config) {
    throw new Error(
      'No active AI provider configured. Please add an API key in Settings.'
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
