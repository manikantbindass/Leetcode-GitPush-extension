import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
    ],
  },
  // Base JS recommended
  js.configs.recommended,
  // TypeScript recommended (type-aware)
  ...tseslint.configs.recommended,
  // React + browser environment
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        chrome: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks
      ...reactHooks.configs.recommended.rules,
      // React refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      // Allow empty catch blocks (used extensively in extension for silent failures)
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  }
);
