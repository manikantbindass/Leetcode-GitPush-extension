import * as storage from '@/lib/storage';
import { GitHubAPI } from '@/lib/github/api';

export async function getGitHubClient(): Promise<GitHubAPI | null> {
  const token = await storage.get('githubToken');
  if (!token) return null;
  return new GitHubAPI(token);
}

export async function startOAuth(): Promise<void> {
  const clientId =
    (await storage.get('githubClientId')) ?? 'YOUR_GITHUB_CLIENT_ID';
  const serverUrl =
    (await storage.get('oauthServerUrl')) ?? 'http://localhost:3001';

  const redirectUri = chrome.identity.getRedirectURL();
  const state = crypto.randomUUID();
  const scopes = 'repo,user,read:org';

  const authUrl = [
    'https://github.com/login/oauth/authorize',
    `?client_id=${clientId}`,
    `&redirect_uri=${encodeURIComponent(redirectUri)}`,
    `&scope=${encodeURIComponent(scopes)}`,
    `&state=${state}`,
  ].join('');

  let redirected: string;
  try {
    redirected = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        result => {
          if (chrome.runtime.lastError || !result) {
            reject(new Error(chrome.runtime.lastError?.message ?? 'OAuth cancelled'));
          } else {
            resolve(result);
          }
        }
      );
    });
  } catch (err) {
    chrome.runtime.sendMessage({
      type: 'AUTH_ERROR',
      payload: { error: String(err) },
    });
    return;
  }

  const url = new URL(redirected);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (!code || returnedState !== state) {
    chrome.runtime.sendMessage({
      type: 'AUTH_ERROR',
      payload: { error: 'Invalid OAuth response' },
    });
    return;
  }

  try {
    const tokenRes = await fetch(
      `${serverUrl}/auth/github/callback?code=${code}&state=${state}`
    );
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
    const { access_token } = await tokenRes.json();
    if (!access_token) throw new Error('No access token returned');

    const github = new GitHubAPI(access_token);
    const user = await github.getUser();

    await storage.setMany({
      githubToken: access_token,
      githubUser: user,
    });

    chrome.runtime.sendMessage({
      type: 'AUTH_COMPLETE',
      payload: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
      },
    });
  } catch (err) {
    chrome.runtime.sendMessage({
      type: 'AUTH_ERROR',
      payload: { error: String(err) },
    });
  }
}

export async function logout(): Promise<void> {
  await storage.setMany({
    githubToken: undefined,
    githubUser: undefined,
    selectedRepo: undefined,
    selectedBranch: undefined,
    repoTree: undefined,
    repoTreeFetchedAt: undefined,
  });
}
