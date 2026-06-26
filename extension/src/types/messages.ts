import type { QueueItem, Submission } from './submission';
import type { AIProviderConfig } from './ai';

export type MessageType =
  | 'SUBMISSION_DETECTED'
  | 'TRIGGER_SYNC'
  | 'SYNC_COMPLETE'
  | 'SYNC_ERROR'
  | 'AUTH_START'
  | 'AUTH_COMPLETE'
  | 'AUTH_ERROR'
  | 'AUTH_LOGOUT'
  | 'GET_STATUS'
  | 'STATUS_RESPONSE'
  | 'QUEUE_RETRY'
  | 'QUEUE_CLEAR'
  | 'QUEUE_UPDATE'
  | 'FETCH_REPOS'
  | 'REPOS_RESPONSE'
  | 'FETCH_BRANCHES'
  | 'BRANCHES_RESPONSE'
  | 'FETCH_TREE'
  | 'TREE_RESPONSE'
  | 'TEST_PROVIDER'
  | 'PROVIDER_TEST_RESULT'
  | 'OPEN_OPTIONS';

export interface BaseMessage {
  type: MessageType;
  payload?: unknown;
}

export interface SubmissionDetectedMessage extends BaseMessage {
  type: 'SUBMISSION_DETECTED';
  payload: Submission;
}

export interface SyncCompleteMessage extends BaseMessage {
  type: 'SYNC_COMPLETE';
  payload: {
    submissionId: string;
    repoUrl: string;
    filesCreated: string[];
    commitSha: string;
  };
}

export interface SyncErrorMessage extends BaseMessage {
  type: 'SYNC_ERROR';
  payload: {
    submissionId: string;
    error: string;
  };
}

export interface QueueUpdateMessage extends BaseMessage {
  type: 'QUEUE_UPDATE';
  payload: QueueItem[];
}

export interface AuthCompleteMessage extends BaseMessage {
  type: 'AUTH_COMPLETE';
  payload: {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
  };
}

export interface ProviderTestResultMessage extends BaseMessage {
  type: 'PROVIDER_TEST_RESULT';
  payload: {
    providerType: string;
    success: boolean;
    error?: string;
  };
}

export interface TestProviderMessage extends BaseMessage {
  type: 'TEST_PROVIDER';
  payload: AIProviderConfig;
}

export interface FetchBranchesMessage extends BaseMessage {
  type: 'FETCH_BRANCHES';
  payload: { owner: string; repo: string };
}

export type ExtensionMessage =
  | SubmissionDetectedMessage
  | SyncCompleteMessage
  | SyncErrorMessage
  | QueueUpdateMessage
  | AuthCompleteMessage
  | ProviderTestResultMessage
  | TestProviderMessage
  | FetchBranchesMessage
  | BaseMessage;
