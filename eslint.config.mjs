import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/', 'public/', 'tools/', '.claude/', 'src/util/leaflet_tile_workaround.js'],
  },
  js.configs.recommended,
  tseslint.configs.eslintRecommended,
  pluginVue.configs['flat/essential'],
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['src/**'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['*.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.node,
    },
  },
  {
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
);
