import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import svelteConfig from './svelte.config.js'
import globals from 'globals'

export default ts.config(
  // js
  js.configs.recommended,
  // ts
  ts.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {},
    },
  },
  // svelte
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig: svelteConfig,
      },
    },
    rules: {
      // Svelte $bindable() props trigger false positives
      'no-useless-assignment': 'off',
    },
  },
  {
    // A `.svelte.ts` file holds runes outside a component, and the Svelte
    // flat/recommended config above matches it with svelte-eslint-parser but no
    // embedded script parser, which cannot read TypeScript syntax such as
    // `import type`. Pointing it at the TS parser, as the `.svelte` block above
    // already does, fixes that.
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      'svelte/no-at-html-tags': 'off',
    },
  },
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
        ...globals.browser,
        $$Generic: 'readonly',
      },
    },
    ignores: ['**/*.config.js'],
  },
  {
    files: ['**/*.stories.svelte'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
