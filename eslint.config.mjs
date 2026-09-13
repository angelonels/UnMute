import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const generated = [
  '**/dist/**',
  '**/node_modules/**',
  '**/.wrangler/**',
  'backend/openapi/**',
  'backend/worker-configuration.d.ts',
  'frontend/src/api/generated/**',
  'frontend/src/routeTree.gen.ts',
  'frontend/src/theme/unmute.{css,js,d.ts,variants.d.ts}',
];

export default tseslint.config(
  { ignores: generated },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme'], location: 'start' }],
    },
  },
  {
    ...reactHooks.configs.flat['recommended-latest'],
    files: ['frontend/src/**/*.{ts,tsx}'],
  },
  {
    files: ['frontend/src/routes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '../features/*/*', '../../features/*/*'],
              message: 'Routes import a feature through its public index.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['frontend/src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/*/*',
                '../../*/components/*',
                '../../*/hooks/*',
                '../../*/store/*',
              ],
              message: 'Cross-feature imports go through the owning feature index.',
            },
            {
              group: ['@/routes/*', '../../routes/*'],
              message: 'Features cannot depend on routes.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use the generated API client for product requests.' },
      ],
    },
  },
  {
    files: ['backend/src/features/**/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../repositories/*', '../repositories/*', '../../db/*', '../db/*'],
              message: 'HTTP adapters call use cases; they do not access persistence directly.',
            },
          ],
        },
      ],
    },
  },
);
