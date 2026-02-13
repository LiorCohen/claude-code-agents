import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import allowedStructure from './eslint-rules/allowed-structure.js';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      local: { rules: { 'allowed-structure': allowedStructure } },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // No let — use const
      'prefer-const': 'error',
      'no-var': 'error',

      // No function keyword — use arrow functions
      'func-style': ['error', 'expression'],

      // No default exports, no classes (except Error subclasses)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports instead of default exports',
        },
        {
          selector: 'ClassDeclaration:not([superClass.name="Error"])',
          message: 'Use functions and types instead of classes',
        },
        {
          selector: 'ClassExpression:not([superClass.name="Error"])',
          message: 'Use functions and types instead of classes',
        },
      ],

      // No any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Explicit module boundary types
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Banned utility libraries + barrel imports enforcement
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['lodash', 'lodash/*'], message: 'lodash is banned — use native methods' },
          { group: ['ramda', 'ramda/*'], message: 'ramda is banned — use native methods' },
          { group: ['immer'], message: 'immer is banned — use immutable patterns' },
          { group: ['@/lib/*'], message: 'Import from @/lib barrel' },
          { group: ['@/hooks/*'], message: 'Import from @/hooks barrel' },
          { group: ['@/routes/*'], message: 'Import from @/routes barrel' },
          { group: ['@/services/*'], message: 'Import from @/services barrel' },
          { group: ['@/types/*'], message: 'Import from @/types barrel' },
          { group: ['@/components/**'], message: 'Import from @/components barrel' },
          { group: ['@/pages/**'], message: 'Import from @/pages barrel' },
        ],
      }],

      // Custom: allowed directory structure
      'local/allowed-structure': 'error',
    },
  },
);
