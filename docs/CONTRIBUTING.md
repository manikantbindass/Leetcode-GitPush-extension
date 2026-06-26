# 🤝 Contributing to LeetCode AI Sync

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

---

## 📜 Code of Conduct

This project adheres to a simple code of conduct: **be respectful, inclusive, and constructive**. We welcome contributors of all experience levels. Harassment, discrimination, or hostile behavior will not be tolerated.

By participating in this project, you agree to uphold these standards in all interactions — issues, PRs, discussions, and code reviews.

---

## 🐛 Filing Issues

### Bug Reports

Before filing a bug report:
1. Search [existing issues](https://github.com/your-username/leetcode-ai-sync/issues) to avoid duplicates
2. Try reproducing on the latest version

When filing, include:
- **Extension version** (from `chrome://extensions/`)
- **Chrome version** (from `chrome://version/`)
- **Operating System**
- **Steps to reproduce** — be specific
- **Expected behavior** vs **Actual behavior**
- **Console logs** — from both the background service worker and content script
- **Screenshots or screen recordings** if applicable

### Feature Requests

Open an issue with the `[Feature Request]` prefix in the title. Describe:
- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered
- Why this would benefit other users

---

## 🔀 Submitting Pull Requests

### Workflow

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/add-rust-template
   git checkout -b fix/oauth-callback-race-condition
   ```
3. **Make your changes** following the code style guidelines
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(ai): add support for Ollama local models"
   git commit -m "fix(content): handle LeetCode GraphQL endpoint change"
   ```
5. **Push** to your fork and open a PR against `main`

### PR Requirements

- [ ] PR title follows Conventional Commits format
- [ ] TypeScript type-check passes (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)
- [ ] No new `console.log` statements (use the logger utility)
- [ ] New features include documentation updates

---

## 💻 Development Setup

Follow the [Setup Guide](SETUP.md) to get the project running locally.

Key commands:

```bash
# Extension
cd extension
npm run dev          # Start Vite dev build (watch mode)
npm run type-check   # TypeScript checking
npm run lint         # ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm test             # Run tests

# Server
cd server
npm run dev          # Start dev server with hot reload
npm run type-check   # TypeScript checking
npm run build        # Compile TypeScript
```

---

## 🎨 Code Style Guidelines

### TypeScript

- **Strict mode** is enabled — no `any` types without explicit justification
- Prefer `interface` over `type` for object shapes
- Use `const` over `let`; avoid `var`
- All async functions must handle errors (try/catch or `.catch()`)
- Export types from `src/types/`

### React Components

- Functional components only — no class components
- One component per file
- File name = component name (PascalCase): `SubmissionCard.tsx`
- Use custom hooks to extract complex logic from components
- Use Zustand for global state

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `SyncButton.tsx` |
| Hooks | camelCase with `use` prefix | `useGitHubAuth.ts` |
| Utilities | camelCase | `formatSlug.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `SubmissionRecord` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

**Scopes:** `extension`, `server`, `content`, `background`, `popup`, `options`, `ai`, `github`, `auth`

---

## 🏗️ Architecture Overview

```
extension/src/
├── background/
│   └── index.ts          # Service worker: submission queue, AI calls, GitHub pushes
├── content/
│   ├── index.ts          # Content script entry: injects XHR interceptor
│   └── injected.js       # Runs in page context: hooks XMLHttpRequest & fetch
├── popup/
│   ├── index.html
│   ├── main.tsx
│   └── App.tsx
├── options/
│   ├── index.html
│   ├── main.tsx
│   └── App.tsx
├── hooks/
│   ├── useGitHubAuth.ts
│   ├── useSettings.ts
│   └── useHistory.ts
├── lib/
│   ├── github.ts
│   ├── ai/
│   │   ├── index.ts
│   │   ├── deepseek.ts
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── gemini.ts
│   ├── storage.ts
│   ├── queue.ts
│   └── prompt.ts
└── types/
    └── index.ts
```

### Data Flow

```
LeetCode page
  └─ injected.js intercepts XHR/fetch
  └─ content/index.ts receives postMessage
  └─ Sends chrome.runtime.sendMessage to background

background/index.ts
  └─ Validates submission (status === 'Accepted')
  └─ Extracts problem metadata
  └─ Calls AI provider to get solution code
  └─ Pushes to GitHub via REST API
  └─ Updates IndexedDB history
  └─ Sends chrome.notifications
```

---

## ➕ Adding a New AI Provider

1. **Create the client** at `extension/src/lib/ai/<provider>.ts`:

```typescript
import type { AIClient, GenerateOptions, GenerateResult } from '@/types';

export class MyProviderClient implements AIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const response = await fetch('https://api.myprovider.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'user', content: options.prompt }],
        max_tokens: options.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`MyProvider API error: ${response.status}`);
    }

    const data = await response.json() as MyProviderResponse;
    return { code: data.choices[0].message.content.trim() };
  }
}
```

2. **Register in the factory** at `extension/src/lib/ai/index.ts`
3. **Add to the `AIProvider` type** in `extension/src/types/index.ts`
4. **Add model options** in the Options page UI
5. **Add `host_permissions`** in `extension/public/manifest.json`
6. **Update the README** — add to the Supported AI Providers table

---

## ➕ Adding a New Output Language

1. **Add to the `Language` type** in `extension/src/types/index.ts`
2. **Add the file extension mapping** in `extension/src/lib/github.ts`
3. **Update the AI prompt** in `extension/src/lib/prompt.ts`
4. **Add to the UI** in the Options page language selector
5. **Update the README** — add to the Supported Languages table

---

## ❓ Questions?

Open a [Discussion](https://github.com/your-username/leetcode-ai-sync/discussions) — we are happy to help!
