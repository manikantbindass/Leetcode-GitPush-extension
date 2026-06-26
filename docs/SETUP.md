# 🛠️ Setup Guide

This guide walks you through setting up **LeetCode AI Sync** for development and production use.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Minimum Version | Download |
|---|---|---|
| **Node.js** | 18.0.0 | [nodejs.org](https://nodejs.org) |
| **npm** | 9.0.0 | Bundled with Node.js |
| **Git** | 2.40.0 | [git-scm.com](https://git-scm.com) |
| **Google Chrome** | 120.0 | [google.com/chrome](https://www.google.com/chrome) |

Verify your installations:

```bash
node --version   # Should be v18.x.x or higher
npm --version    # Should be 9.x.x or higher
git --version    # Should be 2.x.x or higher
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/leetcode-ai-sync.git
cd leetcode-ai-sync
```

---

## 2. Register a GitHub OAuth App

The extension uses a small relay server to handle the GitHub OAuth 2.0 flow securely.

### 2.1 Create the OAuth App

1. Sign in to GitHub and go to: **Settings → Developer settings → OAuth Apps**
   Direct link: [https://github.com/settings/developers](https://github.com/settings/developers)

2. Click **"New OAuth App"**

3. Fill in the registration form:

   | Field | Value |
   |---|---|
   | Application name | `LeetCode AI Sync` |
   | Homepage URL | `http://localhost:3001` |
   | Application description | `Sync LeetCode solutions to GitHub automatically` |
   | Authorization callback URL | `http://localhost:3001/auth/github/callback` |

4. Click **"Register application"**

### 2.2 Get Your Credentials

After registering:

1. You will see your **Client ID** on the app page — copy it
2. Click **"Generate a new client secret"** — copy the secret immediately (it won't be shown again)

> ⚠️ **Security Warning:** Never commit your Client Secret to source control. Always use environment variables.

---

## 3. Configure the Server

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
GITHUB_CLIENT_ID=your_client_id_from_step_2
GITHUB_CLIENT_SECRET=your_client_secret_from_step_2
ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID_HERE
PORT=3001
```

> **Note:** Update `ALLOWED_ORIGINS` with your actual extension ID after loading in Chrome. Find it at `chrome://extensions/`.

---

## 4. Install Dependencies

```bash
# Server dependencies
cd server
npm install

# Extension dependencies
cd ../extension
npm install
```

---

## 5. Development Workflow

### 5.1 Start the OAuth Server

```bash
cd server
npm run dev
# Server running at http://localhost:3001
```

### 5.2 Build the Extension (watch mode)

```bash
cd extension
npm run dev
```

### 5.3 Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `extension/dist/` folder
5. The LeetCode AI Sync icon appears in your toolbar

### 5.4 Configure the Extension

1. Click the extension icon → settings icon → Options page
2. Sign in with GitHub
3. Select your target repository
4. Add your AI provider API key
5. Choose preferred output language(s)

---

## 6. Building for Production

```bash
cd extension
npm run build
npm run zip
# Creates leetcode-ai-sync.zip
```

---

## 7. Troubleshooting

### ❌ Extension not detecting submissions

- Ensure you are on `https://leetcode.com/`
- Check content script logs: DevTools on LeetCode → Console → look for `[LeetCode AI Sync]`
- Try reloading the extension from `chrome://extensions/`

### ❌ OAuth callback error

- Verify server is running on port 3001
- Check the **Authorization callback URL** exactly matches `http://localhost:3001/auth/github/callback`
- Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `server/.env` are correct

### ❌ GitHub push failing

- Confirm the target repository exists and user has write access
- Check background service worker console: `chrome://extensions/` → click "Service Worker"
- Ensure `host_permissions` includes `https://api.github.com/*`

### ❌ AI generation failing

- Verify your API key is saved correctly in Options
- Check your API key has sufficient credits/quota
- Look for error details in the background service worker console

### ❌ CORS errors in server

- Update `ALLOWED_ORIGINS` in `server/.env` to match your extension's actual ID
- Find your extension ID at `chrome://extensions/`
- Restart the server after changing `.env`
