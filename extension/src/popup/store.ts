import { create } from 'zustand';
import type { AIProviderConfig, AIProviderType } from '@/types/ai';
import type { GitHubUser, Repository } from '@/types/github';
import type { Language, QueueItem, Submission } from '@/types/submission';
import type { ExtensionStorage, FileNamingStyle, SolvedStats } from '@/types/storage';
import * as storage from '@/lib/storage';
import { sendMessage } from '@/lib/messaging';

interface PopupState {
  // Storage-backed data
  githubUser: GitHubUser | null;
  selectedRepo: Repository | null;
  selectedBranch: string | null;
  activeProvider: AIProviderType | null;
  providers: AIProviderConfig[];
  solvedStats: SolvedStats;
  recentSubmissions: Submission[];
  queue: QueueItem[];
  streak: number;
  lastSynced: number | null;
  autoPush: boolean;
  dryRun: boolean;
  targetLanguages: Language[];
  fileNamingStyle: FileNamingStyle;
  commitTemplate: string;
  oauthServerUrl: string;
  githubClientId: string;
  customInstructions: string;

  // UI state
  isLoading: boolean;
  activeTab: 'dashboard' | 'queue' | 'settings';

  // Actions
  loadFromStorage: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'queue' | 'settings') => void;
  triggerAuth: () => void;
  triggerLogout: () => Promise<void>;
  retryQueue: () => void;
  clearQueue: () => void;
  saveSettings: (settings: Partial<ExtensionStorage>) => Promise<void>;
  setQueueItems: (items: QueueItem[]) => void;
}

export const usePopupStore = create<PopupState>((set, get) => ({
  // Defaults
  githubUser: null,
  selectedRepo: null,
  selectedBranch: null,
  activeProvider: null,
  providers: [],
  solvedStats: { easy: 0, medium: 0, hard: 0, total: 0 },
  recentSubmissions: [],
  queue: [],
  streak: 0,
  lastSynced: null,
  autoPush: true,
  dryRun: false,
  targetLanguages: ['java', 'python', 'javascript', 'cpp', 'go', 'typescript'],
  fileNamingStyle: 'number-slug',
  commitTemplate: 'feat: add {title} (#{number})',
  oauthServerUrl: 'http://localhost:3001',
  githubClientId: '',
  customInstructions: '',


  isLoading: false,
  activeTab: 'dashboard',

  loadFromStorage: async () => {
    set({ isLoading: true });
    const data = await storage.getAll();
    set({
      githubUser: data.githubUser ?? null,
      selectedRepo: data.selectedRepo ?? null,
      selectedBranch: data.selectedBranch ?? null,
      activeProvider: data.activeProvider ?? null,
      providers: data.providers ?? [],
      solvedStats: data.solvedStats ?? { easy: 0, medium: 0, hard: 0, total: 0 },
      recentSubmissions: data.recentSubmissions ?? [],
      queue: data.queue ?? [],
      streak: data.streak ?? 0,
      lastSynced: data.lastSynced ?? null,
      autoPush: data.autoPush ?? true,
      dryRun: data.dryRun ?? false,
      targetLanguages: (data.targetLanguages as Language[]) ?? ['java', 'python', 'javascript'],
      fileNamingStyle: data.fileNamingStyle ?? 'number-slug',
      commitTemplate: data.commitTemplate ?? 'feat: add {title} (#{number})',
      oauthServerUrl: data.oauthServerUrl ?? 'http://localhost:3001',
      githubClientId: data.githubClientId ?? '',
      customInstructions: data.customInstructions ?? '',
      isLoading: false,
    });

    // Subscribe to storage changes for live updates
    storage.onChange(changes => {
      const update: Partial<PopupState> = {};
      if (changes.githubUser !== undefined) update.githubUser = changes.githubUser ?? null;
      if (changes.queue !== undefined) update.queue = changes.queue ?? [];
      if (changes.solvedStats !== undefined) update.solvedStats = changes.solvedStats ?? get().solvedStats;
      if (changes.recentSubmissions !== undefined) update.recentSubmissions = changes.recentSubmissions ?? [];
      if (changes.streak !== undefined) update.streak = changes.streak ?? 0;
      if (changes.lastSynced !== undefined) update.lastSynced = changes.lastSynced ?? null;
      if (changes.selectedRepo !== undefined) update.selectedRepo = changes.selectedRepo ?? null;
      if (changes.selectedBranch !== undefined) update.selectedBranch = changes.selectedBranch ?? null;
      if (changes.activeProvider !== undefined) update.activeProvider = changes.activeProvider ?? null;
      if (changes.providers !== undefined) update.providers = changes.providers ?? [];
      if (Object.keys(update).length) set(update);
    });
  },

  setActiveTab: tab => set({ activeTab: tab }),

  triggerAuth: () => {
    sendMessage({ type: 'AUTH_START' }).catch(console.error);
  },

  triggerLogout: async () => {
    await sendMessage({ type: 'AUTH_LOGOUT' });
    set({ githubUser: null, selectedRepo: null, selectedBranch: null });
  },

  retryQueue: () => {
    sendMessage({ type: 'QUEUE_RETRY' }).catch(console.error);
  },

  clearQueue: () => {
    sendMessage({ type: 'QUEUE_CLEAR' }).catch(console.error);
    set({ queue: [] });
  },

  saveSettings: async (settings: Partial<ExtensionStorage>) => {
    await storage.setMany(settings);
    // Update local state
    const update: Partial<PopupState> = {};
    if (settings.selectedRepo !== undefined) update.selectedRepo = settings.selectedRepo ?? null;
    if (settings.selectedBranch !== undefined) update.selectedBranch = settings.selectedBranch ?? null;
    if (settings.activeProvider !== undefined) update.activeProvider = settings.activeProvider ?? null;
    if (settings.providers !== undefined) update.providers = settings.providers ?? [];
    if (settings.targetLanguages !== undefined) update.targetLanguages = (settings.targetLanguages as Language[]) ?? [];
    if (settings.fileNamingStyle !== undefined) update.fileNamingStyle = settings.fileNamingStyle ?? 'number-slug';
    if (settings.autoPush !== undefined) update.autoPush = settings.autoPush ?? true;
    if (settings.dryRun !== undefined) update.dryRun = settings.dryRun ?? false;
    if (settings.commitTemplate !== undefined) update.commitTemplate = settings.commitTemplate ?? '';
    if (settings.oauthServerUrl !== undefined) update.oauthServerUrl = settings.oauthServerUrl ?? '';
    if (settings.githubClientId !== undefined) update.githubClientId = settings.githubClientId ?? '';
    if (settings.customInstructions !== undefined) update.customInstructions = settings.customInstructions ?? '';
    set(update);
  },

  setQueueItems: items => set({ queue: items }),
}));
