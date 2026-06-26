# ⚡ Chrome Installation Guide — LeetCode AI Sync

> Step-by-step instructions to install and set up the extension in Google Chrome.

---

## Prerequisites

Before you start, make sure you have:

- ✅ **Google Chrome** 120 or newer
- ✅ **Node.js 18+** and **npm 9+** — [Download here](https://nodejs.org/)
- ✅ **Git** — [Download here](https://git-scm.com/)
- ✅ A **GitHub account** with a repository for your DSA solutions

---

## Step 1 — Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/manikantbindass/Leetcode-GitPush-extension.git
cd Leetcode-GitPush-extension
```

---

## Step 2 — Install Dependencies & Build

```bash
cd extension
npm install
npm run build
```

**Expected output:**
```
vite v5.4.21 building for production...
✓ 1620 modules transformed.
✓ built in 6.89s
```

A `dist/` folder is created inside `extension/`. This is what Chrome loads.

---

## Step 3 — Open Chrome Extensions Page

Open Chrome and navigate to:

```
chrome://extensions/
```

Or go to: **⋮ Menu → More Tools → Extensions**

---

## Step 4 — Enable Developer Mode

Look for the **"Developer mode"** toggle in the **top-right corner** of the page:

```
┌─────────────────────────────────────────────────────┐
│ Extensions                          Developer mode ⬛ │
│ [Load unpacked] [Pack extension] [Update]            │
└─────────────────────────────────────────────────────┘
```

Toggle it **ON** (it turns blue). Three new buttons appear at the top left.

---

## Step 5 — Load Unpacked Extension

1. Click **"Load unpacked"** (top-left)
2. A **folder picker** dialog opens
3. Navigate to where you cloned the repo and select:

```
📁 Leetcode-GitPush-extension/
  └── 📁 extension/
        └── 📁 dist/   ← SELECT THIS FOLDER
```

4. Click **"Select Folder"**

The **LeetCode AI Sync** card appears in your extensions list with the ⚡ icon.

---

## Step 6 — Pin to Toolbar

1. Click the **🧩 puzzle piece** icon in Chrome's top-right toolbar
2. Find **"LeetCode AI Sync"** in the dropdown list
3. Click the **📌 pin icon** next to it

The ⚡ icon is now pinned to your toolbar for instant access.

---

## Step 7 — Connect Your GitHub Account

1. Click the ⚡ **extension icon** in the toolbar
2. The popup opens on the **Connect GitHub** screen

### Create a GitHub Token

Click **"Step 1 — Create Token"** — it opens GitHub with scopes pre-filled. Then:

| Setting | Value |
|---|---|
| **Note** | `LeetCode AI Sync` |
| **Expiration** | `No expiration` (recommended) |
| **Scopes** | ✅ `repo` ✅ `user` *(pre-selected)* |

Click **"Generate token"** → **Copy the token** (shown only once!).

### Paste & Connect

- Paste the copied token into the extension's input field
- Click **"CONNECT GITHUB"**
- You'll be taken to the Dashboard automatically ✓

---

## Step 8 — Configure Settings

Click the **Settings tab** in the popup and configure:

### Repository
- Select your DSA/LeetCode solutions repo from the dropdown
- Select the branch (usually `main`)

### AI Provider
- **DeepSeek Coder** — recommended (cheapest, great code quality)
  - Get your API key at [platform.deepseek.com](https://platform.deepseek.com)
  - Model: `deepseek-coder`
  - Click **TEST** to verify → click **SET ACTIVE**

### Output Languages
- Select all languages you want generated (e.g., Java + Python + Go)

### File Naming Style
- Recommended: `0001-two-sum/TwoSum.java` (number-slug format)

---

## Step 9 — Set AI Folder Instructions

This is the key setting that puts solutions in the **right existing folder** of your repo.

In **Settings → AI Folder Instructions**, add rules like:

```
- SQL/Database/MySQL problems → put in 'MySQL' folder
- Array/Hashing problems → put in 'Arrays' folder
- Binary Tree/Tree problems → put in 'Trees' folder
- Graph/BFS/DFS problems → put in 'Graphs' folder
- Dynamic Programming → put in 'DP' folder
- Sliding Window → put in 'SlidingWindow' folder
- Stack/Monotonic Stack → put in 'Stack' folder
- Linked List → put in 'LinkedList' folder
- Two Pointers → put in 'TwoPointers' folder
- Binary Search → put in 'BinarySearch' folder
```

> **How it works:** The extension sends your repo's actual folder names + the problem's topics to DeepSeek, which picks the exact matching folder name. No new folders are created unless needed.

---

## Step 10 — Save Settings

Click **"SAVE SETTINGS"** at the bottom of the Settings tab.

---

## Step 11 — Test the Extension

1. Go to [leetcode.com](https://leetcode.com)
2. Open any problem and solve it
3. Click **Submit** → wait for **"Accepted"**
4. Watch the extension popup → **Queue tab** shows:
   ```
   Two Sum   [PROCESSING]  →  [PUSHED ✓]
   ```
5. Open your GitHub repository — the solution files are there! 🎉

> **If auto-detect doesn't trigger:** Click **"SYNC LAST SUBMISSION"** on the Dashboard tab.

---

## Updating the Extension

When new code is released:

```bash
cd Leetcode-GitPush-extension
git pull
cd extension
npm run build
```

Then go to `chrome://extensions/` and click the **🔄 refresh button** on the LeetCode AI Sync card.

---

## Troubleshooting

### Extension not appearing after load
- Make sure you selected the `extension/dist/` folder (not `extension/` itself)
- Check that `dist/manifest.json` exists — if not, run `npm run build` again

### "0 problems solved" on Dashboard
- The extension needs LeetCode to be open in a tab
- Click **"SYNC LAST SUBMISSION"** to manually fetch your latest accepted problem
- Make sure you're logged into LeetCode in Chrome

### Solutions going to wrong folder
- Add more specific rules in **Settings → AI Folder Instructions**
- Mention the exact folder names from your repo

### GitHub push fails (403 / 404)
- Token may be missing `repo` scope — [create a new one](https://github.com/settings/tokens/new?scopes=repo,user)
- Check that your repo name in settings matches exactly

### AI not generating solutions
- Click **TEST** next to your provider in Settings → check the error message
- Verify your API key is correct and has credits/quota remaining

### Extension stops working after Chrome update
- Go to `chrome://extensions/` → click **🔄 Refresh** on the card
- If still broken, reload unpacked: remove the extension and re-add `dist/` folder

---

## Uninstalling

1. Go to `chrome://extensions/`
2. Find **LeetCode AI Sync**
3. Click **"Remove"**

Your GitHub tokens and repository data are not affected.

---

## Quick Reference

| Action | How |
|---|---|
| Open popup | Click ⚡ icon in toolbar |
| Manual sync | Dashboard → "SYNC LAST SUBMISSION" |
| View queue | Queue tab in popup |
| Change settings | Settings tab in popup |
| Update extension | `npm run build` → 🔄 refresh in `chrome://extensions/` |
| View AI instructions | Settings → AI Folder Instructions |

---

*Need help? Open an issue at [github.com/manikantbindass/Leetcode-GitPush-extension/issues](https://github.com/manikantbindass/Leetcode-GitPush-extension/issues)*
