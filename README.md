# ⚡ LeetCode AI Sync

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-00f5ff.svg?style=for-the-badge)](https://github.com/manikantbindass/Leetcode-GitPush-extension/releases)
[![License](https://img.shields.io/badge/license-MIT-bf00ff.svg?style=for-the-badge)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-ff006e.svg?style=for-the-badge&logo=googlechrome)](https://chrome.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-00f5ff.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-bf00ff.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![CI](https://github.com/manikantbindass/Leetcode-GitPush-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/manikantbindass/Leetcode-GitPush-extension/actions)

**Solve on LeetCode → AI generates solutions in every language → Auto-pushed to GitHub. Zero clicks.**

*Cyberpunk-themed Chrome extension with glassmorphism UI, neon aesthetics & liquidity pool animations.*

</div>

---

## 🎬 How It Works

```
You get Accepted on LeetCode
         │
         ├─► Layer 1: Network intercept (instant — catches code at submit)
         │
         ├─► Layer 2: DOM observer (watches for "Accepted" verdict)
         │
         └─► Layer 3: Background polling every 2 min (guaranteed fallback)
                      │
                      └─► DeepSeek reads your repo tree → picks correct folder
                                    │
                                    └─► Commits all languages to GitHub ✓
```

---

## ✨ Features

### 🔍 Auto-Detection (3 Layers)
- **Layer 1** — Intercepts the LeetCode GraphQL `submitSolution` mutation at network level, captures `typedCode` and `lang` directly
- **Layer 2** — MutationObserver watches the DOM for "Accepted" verdict appearing on screen
- **Layer 3** — Background service worker polls `recentAcSubmissionList` every 2 minutes as guaranteed fallback

### 🤖 AI-Powered Solutions
- Generates optimized solutions in **all languages you select** using DeepSeek/OpenAI/Claude/Gemini
- Includes **time & space complexity** analysis
- Adds **explanation comments** inside the code

### 📂 Smart Folder Placement
- **AI reads your actual repo tree** — sends folder names + problem topics to DeepSeek
- **Custom instructions box** — tell the AI exactly where each problem type goes:
  ```
  MySQL/SQL problems → 'MySQL' folder
  Array problems → 'Arrays' folder
  Tree problems → 'Trees' folder
  ```
- Falls back to intelligent keyword matching if AI unavailable

### 🌐 16 Output Languages
Java · Python · Go · C++ · C · JavaScript · TypeScript · Rust · Kotlin · Swift · C# · PHP · Ruby · Dart · SQL · Pandas

### ⚡ Manual Sync Button
- "SYNC LAST SUBMISSION" button in the popup — fetches your most recent accepted problem via LeetCode GraphQL API directly, no page reload needed

### 🎨 Cyberpunk UI
- **Glassmorphism** panels with `backdrop-blur` and frosted borders
- **Liquidity pool orbs** — animated gradient blobs behind each stat card
- **Neon glow** — cyan/pink/purple/green text with `text-shadow`
- **Cyber corner accents** (L-shaped neon brackets)
- **CRT scanline** texture on body
- **Orbitron** display font for headings

### 🔁 Retry Queue
- Failed pushes automatically retried every minute
- View all queue items with status: `PENDING → PROCESSING → PUSHED ✓ / FAILED ✗`
- Neon-colored per-status filter chips

---

## 🚀 Chrome Installation Guide

> **No web store required** — load it directly as an unpacked extension in under 5 minutes.

### Step 1 — Clone & Build

```bash
git clone https://github.com/manikantbindass/Leetcode-GitPush-extension.git
cd Leetcode-GitPush-extension/extension
npm install
npm run build
```

This creates a `extension/dist/` folder — that's what Chrome will load.

---

### Step 2 — Open Chrome Extensions Page

Open a new Chrome tab and go to:

```
chrome://extensions/
```

---

### Step 3 — Enable Developer Mode

In the top-right corner of the extensions page, toggle **"Developer mode"** to **ON**.

```
┌─────────────────────────────────────────────┐
│  Extensions                  Developer mode ●│
└─────────────────────────────────────────────┘
```

---

### Step 4 — Load Unpacked Extension

1. Click the **"Load unpacked"** button (top-left, appears after enabling Developer mode)
2. In the folder picker dialog, navigate to:
   ```
   Leetcode-GitPush-extension/
   └── extension/
       └── dist/        ← SELECT THIS FOLDER
   ```
3. Click **"Select Folder"**

---

### Step 5 — Pin the Extension

1. Click the **puzzle piece** 🧩 icon in Chrome's toolbar (top-right)
2. Find **"LeetCode AI Sync"**
3. Click the **pin** 📌 icon next to it

The ⚡ neon icon will now appear permanently in your toolbar.

---

### Step 6 — Connect GitHub

1. Click the **⚡ extension icon** to open the popup
2. You'll see the **Connect GitHub** screen
3. Click **"Step 1 — Create Token"** → opens GitHub with scopes pre-filled
4. On GitHub:
   - Set **Note**: `LeetCode AI Sync`
   - Set **Expiration**: `No expiration`
   - Ensure **`repo`** and **`user`** scopes are checked ✓
   - Click **"Generate token"**
   - **Copy the token** (shown only once!)
5. Paste the token back in the extension → Click **"CONNECT GITHUB"**

---

### Step 7 — Configure Settings

Open the extension → **Settings tab**:

| Setting | Recommended value |
|---|---|
| Repository | Your DSA repo (e.g. `manikantbindass/DSA-Preparation-FAANG`) |
| Branch | `main` |
| AI Provider | DeepSeek Coder (free, fast) |
| Output Languages | Java, Python, Go (or all you want) |
| File naming | `0001-two-sum/TwoSum.java` |
| Auto-push | ✅ ON |

---

### Step 8 — Add AI Instructions

In **Settings → AI Folder Instructions**, paste rules for your repo:

```
- MySQL/SQL/Database problems → put in 'MySQL' folder
- Array/String/Hashing problems → put in 'Arrays' folder  
- Tree/Binary Tree problems → put in 'Trees' folder
- Graph/BFS/DFS problems → put in 'Graphs' folder
- Dynamic Programming problems → put in 'DP' folder
- Sliding Window problems → put in 'SlidingWindow' folder
- Stack/Monotonic Stack → put in 'Stack' folder
- Linked List → put in 'LinkedList' folder
```

DeepSeek will read your actual repo folder names and match exactly.

---

### Step 9 — Test It!

1. Go to [leetcode.com](https://leetcode.com) and open any problem
2. Solve it and click **Submit**
3. When you get **Accepted** → check the extension popup → **Queue tab**
4. You should see it `PROCESSING` then `PUSHED ✓`
5. Check your GitHub repo — the solution files will be there!

> **If auto-detect misses it:** Click **"SYNC LAST SUBMISSION"** on the Dashboard tab. It fetches your latest accepted problem directly via API.

---

### Updating the Extension

After pulling new code:

```bash
cd extension
npm run build
```

Then go to `chrome://extensions/` → click the **🔄 Refresh** button on the LeetCode AI Sync card.

---

## 🤖 Supported AI Providers

| Provider | Recommended Model | API Key | Cost |
|---|---|---|---|
| **DeepSeek** ⭐ | `deepseek-coder` | [platform.deepseek.com](https://platform.deepseek.com) | Very cheap / free tier |
| **OpenAI** | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com) | Pay-per-use |
| **Anthropic** | `claude-3-haiku` | [console.anthropic.com](https://console.anthropic.com) | Pay-per-use |
| **Google Gemini** | `gemini-1.5-flash` | [aistudio.google.com](https://aistudio.google.com) | Free tier |
| **Ollama** | `codellama` | localhost | Free (local) |

---

## 🌐 Supported Output Languages

| Language | Extension | Language | Extension |
|---|---|---|---|
| Java | `.java` | JavaScript | `.js` |
| Python | `.py` | TypeScript | `.ts` |
| Go | `.go` | Rust | `.rs` |
| C++ | `.cpp` | Kotlin | `.kt` |
| C | `.c` | Swift | `.swift` |
| C# | `.cs` | PHP | `.php` |
| Ruby | `.rb` | Dart | `.dart` |
| SQL | `.sql` | Pandas | `.py` |

---

## 📁 Repository Structure Generated

```
DSA-Preparation-FAANG/
├── Arrays/
│   ├── TwoSum.java
│   ├── TwoSum.py
│   └── TwoSum.go
├── Trees/
│   ├── BinaryTreeLevelOrder.java
│   └── BinaryTreeLevelOrder.py
├── MySQL/
│   ├── ConsecutiveNumbers.sql
│   └── ConsecutiveNumbers.py        ← pandas version
├── DP/
│   └── ...
└── README.md                        ← auto-updated with all solutions
```

---

## 🏗️ Project Architecture

```
Leetcode-GitPush-extension/
├── extension/                      # Chrome Extension (React + TypeScript + Vite)
│   ├── src/
│   │   ├── background/
│   │   │   ├── index.ts            # Service worker — queue, GitHub push, polling
│   │   │   ├── ai.ts               # AI provider calls
│   │   │   ├── github.ts           # GitHub API (commit, tree, README)
│   │   │   └── queue.ts            # Retry queue logic
│   │   ├── content/
│   │   │   ├── index.ts            # Content script — injects detector
│   │   │   └── injected.ts         # 3-layer submission detector
│   │   ├── lib/
│   │   │   ├── github/
│   │   │   │   ├── api.ts          # GitHub REST API client
│   │   │   │   ├── tree.ts         # Repo tree + folder matching
│   │   │   │   └── folder.ts       # AI-powered folder selection ← NEW
│   │   │   └── ai/                 # Provider implementations
│   │   ├── popup/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx   # Stats, sync button, recent list
│   │   │   │   ├── Queue.tsx       # Queue view with filter chips
│   │   │   │   └── Settings.tsx    # Full settings with AI instructions
│   │   │   └── store.ts            # Zustand state management
│   │   └── types/                  # TypeScript type definitions
│   └── public/
│       ├── manifest.json           # Manifest V3
│       └── icons/                  # Branded neon icons
└── server/                         # Optional Node.js OAuth server
    └── src/
        └── routes/auth.ts          # GitHub OAuth callback (only for OAuth flow)
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| **"GitHub API 403"** | Token missing `repo` scope. [Create new token](https://github.com/settings/tokens/new?scopes=repo,user) |
| **"Solved 0 problems"** | Click "SYNC LAST SUBMISSION" on Dashboard. Open LeetCode first |
| **Solutions in wrong folder** | Add rules in Settings → AI Folder Instructions |
| **Auto-sync not working** | Check `chrome://extensions/` → make sure extension is enabled. Keep LeetCode tab open |
| **Build fails** | Run `npm install` first, then `npm run build` |
| **Extension not updating** | Go to `chrome://extensions/` → click 🔄 Refresh on the card |
| **No AI solutions generated** | Check API key in Settings → Test connection |

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for full guide.

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## ⚠️ Disclaimer

Not affiliated with LeetCode or GitHub. Use responsibly in accordance with both platforms' Terms of Service.

---

<div align="center">

Built with ⚡ by [manikantbindass](https://github.com/manikantbindass)

*Solve → Sync → Push. Automatically.*

</div>
