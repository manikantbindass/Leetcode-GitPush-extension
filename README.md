# 🧠 LeetCode AI Sync

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-username/leetcode-ai-sync/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg?logo=googlechrome)](https://chrome.google.com/webstore)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/your-username/leetcode-ai-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/leetcode-ai-sync/actions)

> **Auto-detect LeetCode accepted submissions → Generate AI solutions in 14+ languages → Push to GitHub automatically.**

---

## ✨ Features

- 🔍 **Auto-Detection** — Intercepts LeetCode submission responses in real-time via XHR/fetch hooks
- 🤖 **Multi-Provider AI** — Supports DeepSeek, OpenAI, Anthropic (Claude), and Google Gemini
- 🌐 **14+ Languages** — Generate solutions in Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, Ruby, Swift, Kotlin, Scala, PHP, and Dart
- 📁 **Organized Repository** — Pushes solutions with a structured folder layout (`language/difficulty/problem-slug/`)
- 📝 **Auto README** — Automatically maintains a `README.md` in your repo with a table of all solved problems
- 🔐 **GitHub OAuth** — Secure OAuth 2.0 login, no manual token management
- ⚙️ **Full Options Page** — Configure AI providers, target repo, language preferences, and more
- 🔔 **Desktop Notifications** — Get notified on successful push or errors
- 💾 **Local History** — Browse your submission history directly in the popup
- 🌙 **Dark Mode** — Beautiful dark-themed UI built with Tailwind CSS
- ⚡ **Manifest V3** — Built on the latest Chrome Extension standard for security and performance
- 🔁 **Retry Queue** — Failed pushes are automatically retried with exponential backoff

---

## 📸 Screenshots

> 📷 Screenshot coming soon — popup UI showing submission detection and GitHub push status.

> 📷 Screenshot coming soon — options page with AI provider configuration.

> 📷 Screenshot coming soon — GitHub repository with organized solution folders and auto-generated README.

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Google Chrome** 120+
- **Git**
- A **GitHub account**

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/leetcode-ai-sync.git
cd leetcode-ai-sync
```

### Step 2 — Register a GitHub OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name**: `LeetCode AI Sync`
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### Step 3 — Setup the OAuth Server

```bash
cd server
cp .env.example .env
# Edit .env with your GitHub OAuth credentials
npm install
npm run dev
```

### Step 4 — Build the Extension

```bash
cd ../extension
npm install
npm run build
```

### Step 5 — Load Unpacked in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `extension/dist` folder
5. The LeetCode AI Sync icon will appear in your toolbar

---

## 🔧 Environment Variables

### Server (`server/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App Client ID | `Ov23liABC123...` |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App Client Secret | `abc123def456...` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated list of allowed CORS origins | `chrome-extension://abcdefg` |
| `PORT` | ❌ | Server port (default: 3001) | `3001` |

---

## 🤖 Supported AI Providers

| Provider | Model(s) | API Key Required | Free Tier |
|---|---|---|---|
| **DeepSeek** | `deepseek-chat`, `deepseek-coder` | ✅ | ✅ Generous free tier |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo` | ✅ | ❌ Pay-per-use |
| **Anthropic** | `claude-sonnet-4-5`, `claude-3-haiku` | ✅ | ❌ Pay-per-use |
| **Google Gemini** | `gemini-1.5-flash`, `gemini-1.5-pro` | ✅ | ✅ Free tier available |

---

## 🌐 Supported Output Languages

| Language | File Extension | Notes |
|---|---|---|
| Python | `.py` | Default language |
| JavaScript | `.js` | ES2022+ |
| TypeScript | `.ts` | Strict mode |
| Java | `.java` | Java 17+ |
| C++ | `.cpp` | C++17 |
| C | `.c` | C11 |
| Go | `.go` | Go 1.21+ |
| Rust | `.rs` | Rust 2021 edition |
| Ruby | `.rb` | Ruby 3+ |
| Swift | `.swift` | Swift 5.9+ |
| Kotlin | `.kt` | Kotlin 1.9+ |
| Scala | `.scala` | Scala 3 |
| PHP | `.php` | PHP 8.2+ |
| Dart | `.dart` | Dart 3+ |

---

## 🏗️ Architecture

```
leetcode-ai-sync/
├── extension/              # Chrome Extension (React + TypeScript + Vite)
│   ├── src/
│   │   ├── background/     # Service worker
│   │   ├── content/        # Content script
│   │   ├── popup/          # Popup UI
│   │   ├── options/        # Options page
│   │   ├── hooks/          # Shared React hooks
│   │   ├── lib/            # Core business logic
│   │   └── types/          # Shared TypeScript types
│   └── public/
│       ├── manifest.json   # Chrome Extension Manifest V3
│       └── icons/          # Extension icons
└── server/                 # Node.js OAuth relay server
    └── src/
        ├── index.ts        # Express app entry
        └── routes/
            └── auth.ts     # GitHub OAuth callback handler
```

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](docs/CONTRIBUTING.md) and [Setup Guide](docs/SETUP.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This extension is not affiliated with LeetCode or GitHub. Use responsibly and in accordance with both platforms' Terms of Service.
