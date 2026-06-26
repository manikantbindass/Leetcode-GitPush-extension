export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Language =
  | 'java'
  | 'python'
  | 'python3'
  | 'go'
  | 'cpp'
  | 'c'
  | 'javascript'
  | 'typescript'
  | 'rust'
  | 'kotlin'
  | 'swift'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'dart'
  | 'sql'
  | 'pandas';

export type OutputLanguage =
  | 'java'
  | 'python'
  | 'python3'
  | 'go'
  | 'cpp'
  | 'c'
  | 'javascript'
  | 'typescript'
  | 'rust'
  | 'kotlin'
  | 'swift'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'dart'
  | 'sql'
  | 'pandas';

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface Submission {
  id: string;
  problemNumber: number;
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
  topics: string[];
  constraints: string[];
  examples: Example[];
  description: string;
  language: Language;
  code: string;
  runtime: string;
  memory: string;
  url: string;
  timestamp: number;
  isSQL: boolean;
}

export interface QueueItem {
  id: string;
  submission: Submission;
  status: 'pending' | 'processing' | 'done' | 'failed';
  attempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
  filesCreated?: string[];
  repoUrl?: string;
}
