import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

export const authRouter = Router();

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GitHubCallbackQuery {
  code?: string;
  state?: string;
}

/**
 * GET /auth/github/callback
 *
 * Exchanges a GitHub OAuth authorization code for an access token.
 * The Chrome Extension redirects to this endpoint after the user
 * authorizes the OAuth app on GitHub.
 *
 * Query params:
 *   - code  (required): The authorization code returned by GitHub
 *   - state (optional): The state parameter for CSRF protection
 *
 * Returns:
 *   200 { access_token, token_type, scope }
 *   400 { error } on missing code or GitHub API error
 *   500 { error } on unexpected server error
 */
authRouter.get(
  '/github/callback',
  async (req: Request<Record<string, never>, unknown, unknown, GitHubCallbackQuery>, res: Response) => {
    const { code, state } = req.query;

    // Validate required parameter
    if (!code || typeof code !== 'string' || code.trim() === '') {
      res.status(400).json({
        error: 'Missing required query parameter: code',
      });
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[Auth] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not configured');
      res.status(500).json({
        error: 'Server misconfiguration: GitHub OAuth credentials not set',
      });
      return;
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'LeetCode-AI-Sync-Server/1.0.0',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code.trim(),
            ...(state && { state }),
          }),
        }
      );

      if (!tokenResponse.ok) {
        console.error(`[Auth] GitHub token endpoint returned ${tokenResponse.status}`);
        res.status(502).json({
          error: `GitHub API error: ${tokenResponse.status} ${tokenResponse.statusText}`,
        });
        return;
      }

      const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

      // GitHub returns errors in the JSON body with status 200
      if (tokenData.error) {
        console.error('[Auth] GitHub returned token error:', tokenData.error);
        res.status(400).json({
          error: tokenData.error,
          description: tokenData.error_description,
        });
        return;
      }

      if (!tokenData.access_token) {
        res.status(400).json({ error: 'GitHub did not return an access token' });
        return;
      }

      console.log(`[Auth] Successfully exchanged code for token (scope: ${tokenData.scope})`);

      res.json({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Auth] Unexpected error during token exchange:', message);
      res.status(500).json({ error: `Token exchange failed: ${message}` });
    }
  }
);
