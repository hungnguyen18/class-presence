import js from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  // Vue 3 recommended flat config for .vue files
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Use TypeScript parser inside <script lang="ts"> blocks
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  // TypeScript rules for .ts files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  {
    rules: {
      // Allow single-word component names for small demo components
      'vue/multi-word-component-names': 'off',
    },
  },
  // Disable ESLint stylistic rules that might conflict with Prettier
  eslintConfigPrettier,
]
