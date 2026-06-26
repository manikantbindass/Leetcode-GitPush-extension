import type { AIProviderConfig, AIProviderType } from './ai';
import type { GitHubUser, Repository, TreeItem } from './github';
import type { Language, OutputLanguage, QueueItem, Submission } from './submission';

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
  repoTreeItems?: TreeItem[];    // full tree for folder matching
  repoTreeFetchedAt?: number;

  // AI config
  activeProvider?: AIProviderType;
  providers?: AIProviderConfig[];

  // Settings
  targetLanguages?: OutputLanguage[];
  fileNamingStyle?: FileNamingStyle;
  commitTemplate?: string;
  autoPush?: boolean;
  dryRun?: boolean;
  topicMapping?: Record<string, string>;
  customInstructions?: string;  // user instructions for AI folder placement

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
