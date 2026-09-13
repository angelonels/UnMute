import js from '@eslint/js';
import boundaries from '@boundaries/eslint-plugin';
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
    files: ['{frontend,backend}/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'] },
      },
      'boundaries/root-path': process.cwd(),
      'boundaries/dependency-nodes': ['import', 'dynamic-import', 'export'],
      'boundaries/elements': [
        {
          type: 'backend-api',
          pattern: 'backend/src/features/*/api',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'backend-repository',
          pattern: 'backend/src/features/*/repositories',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'backend-db',
          pattern: 'backend/src/features/*/db',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'backend-use-case',
          pattern: 'backend/src/features/*/use-cases',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'backend-policy',
          pattern: 'backend/src/features/*/policies',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'backend-feature',
          pattern: 'backend/src/features/*',
          capture: ['feature'],
          partialMatch: false,
        },
        { type: 'backend-core', pattern: 'backend/src/core', partialMatch: false },
        {
          type: 'frontend-feature',
          pattern: 'frontend/src/features/*',
          capture: ['feature'],
          partialMatch: false,
        },
        { type: 'frontend-route', pattern: 'frontend/src/routes', partialMatch: false },
        { type: 'frontend-app', pattern: 'frontend/src/app', partialMatch: false },
        { type: 'frontend-api', pattern: 'frontend/src/api', partialMatch: false },
        { type: 'frontend-theme', pattern: 'frontend/src/theme', partialMatch: false },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              disallow: {
                to: {
                  element: { type: 'frontend-feature', fileInternalPath: '!index.ts' },
                },
              },
              message: 'Import features through their public index.',
            },
            {
              from: { element: { type: 'frontend-route' } },
              disallow: { to: { element: { type: 'frontend-api' } } },
              message: 'Routes compose features; they do not call the API directly.',
            },
            {
              from: { element: { type: 'frontend-feature' } },
              disallow: { to: { element: { type: 'frontend-route' } } },
              message: 'Features cannot depend on routes.',
            },
            {
              from: { element: { type: 'backend-api' } },
              disallow: [
                { to: { element: { type: 'backend-repository' } } },
                { to: { element: { type: 'backend-db' } } },
              ],
              message: 'HTTP adapters cannot access persistence directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['frontend/src/{app,features,routes,theme}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use the generated API client for product requests.' },
      ],
    },
  },
);
