import type { AIProviderConfig, AIRequestOptions, AIResponse, GenerationResult } from '@/types/ai';
import type { OutputLanguage, Submission } from '@/types/submission';

function buildSystemPrompt(): string {
  return `You are an expert competitive programmer and software engineer.
You will be given a LeetCode problem with its metadata and an accepted solution in one programming language.
Your task is to:
1. Generate clean, production-quality solutions in ALL requested programming languages
2. Provide time and space complexity analysis
3. Provide a clear explanation of the approach and algorithm

IMPORTANT: You MUST respond with ONLY valid JSON in this EXACT format (no markdown, no extra text):
{
  "explanation": "Clear explanation of the approach and algorithm used",
  "complexity": {
    "time": "O(n)",
    "space": "O(1)"
  },
  "solutions": {
    "java": "// Complete Java solution",
    "python": "# Complete Python solution"
  }
}

Only include languages that were requested. Make each solution complete, runnable, and production-quality.`;
}

function buildUserPrompt(submission: Submission, languages: OutputLanguage[]): string {
  const examples = submission.examples
    .map(
      (e, i) =>
        `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${e.output}${e.explanation ? '\nExplanation: ' + e.explanation : ''}`
    )
    .join('\n\n');

  const constraints = submission.constraints.map(c => `• ${c}`).join('\n');

  return `Problem: #${submission.problemNumber}. ${submission.title}
Difficulty: ${submission.difficulty}
Topics: ${submission.topics.join(', ')}
URL: ${submission.url}

Problem Description:
${submission.description || '(see URL above)'}

Examples:
${examples}

Constraints:
${constraints}

Accepted Solution (${submission.language}):
\`\`\`
${submission.code}
\`\`\`

Runtime: ${submission.runtime} | Memory: ${submission.memory}

Generate complete, production-quality solutions for these languages: ${languages.join(', ')}

Remember: respond ONLY with the JSON format specified. No markdown code fences around the JSON.`;
}

function parseGenerationResponse(content: string, languages: OutputLanguage[]): GenerationResult {
  // Clean up common AI response artifacts
  let cleaned = content.trim();
  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

  // Find the JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in AI response');
  }
  const jsonStr = cleaned.slice(start, end + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      solutions: parsed.solutions ?? {},
      complexity: {
        time: parsed.complexity?.time ?? 'O(?)',
        space: parsed.complexity?.space ?? 'O(?)',
      },
      explanation: parsed.explanation ?? '',
    };
  } catch (e) {
    // Last resort: try to extract individual language blocks
    const solutions: Record<string, string> = {};
    for (const lang of languages) {
      const match = content.match(new RegExp(`"${lang}"\\s*:\\s*"([^"]*(?:\\\\"[^"]*)*)"`, 's'));
      if (match) {
        solutions[lang] = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }
    return {
      solutions,
      complexity: { time: 'O(?)', space: 'O(?)' },
      explanation: 'Unable to parse full response. See individual solutions.',
    };
  }
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract chat(options: AIRequestOptions): Promise<AIResponse>;
  abstract testConnection(): Promise<boolean>;

  async generateSolutions(
    submission: Submission,
    languages: OutputLanguage[]
  ): Promise<GenerationResult> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(submission, languages);

    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 8000,
      temperature: 0.1,
    });

    return parseGenerationResponse(response.content, languages);
  }
}
