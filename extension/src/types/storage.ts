import type { AIProviderConfig, AIProviderType } from './ai';
import type { GitHubUser, Repository } from './github';
import type { Language, QueueItem, Submission } from './submission';

export interface SolvedStats {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export type FileNamingStyle = 'slug' | 'number-title' | 'number-slug';

export interface ExtensionStorage {
  // Auth
  githubToken?: string;
  githubUser?: GitHubUser;

  // Repo config
  selectedRepo?: Repository;
  selectedBranch?: string;
  repoTree?: string[];
  repoTreeFetchedAt?: number;

  // AI config
  activeProvider?: AIProviderType;
  providers?: AIProviderConfig[];

  // Settings
  targetLanguages?: Language[];
  fileNamingStyle?: FileNamingStyle;
  commitTemplate?: string;
  autoPush?: boolean;
  dryRun?: boolean;
  topicMapping?: Record<string, string>;

  // OAuth server config
  oauthServerUrl?: string;
  githubClientId?: string;

  // Queue
  queue?: QueueItem[];

  // Stats
  solvedStats?: SolvedStats;
  recentSubmissions?: Submission[];
  lastSynced?: number;
  streak?: number;
  lastSolvedDate?: string;
}
