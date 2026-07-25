import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import tseslint from 'typescript-eslint';

const applicationFiles = ['App.tsx', 'index.ts', 'src/**/*.{ts,tsx}'];
const functionsFiles = ['functions/src/**/*.ts'];
const nodeFiles = [
  ...functionsFiles,
  'functions/tests/**/*.{js,mjs,ts}',
  'scripts/**/*.{js,mjs,ts}',
  'rules-tests/**/*.{js,mjs,ts}',
];
const lintFiles = [...applicationFiles, ...nodeFiles];

export default [
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'functions/lib/**',
      '.expo/**',
      'coverage/**',
      '**/firebase-export*/**',
      '.local-validation/**',
      '**/*.generated.{js,mjs,ts,tsx}',
      '.env',
      '.env.*',
      'serviceAccount*.json',
      '*-firebase-adminsdk-*.json',
      '**/package-lock.json',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: lintFiles,
    rules: {
      'no-constant-condition': 'error',
      'no-duplicate-imports': 'error',
      'no-fallthrough': 'error',
      'no-unreachable': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: applicationFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Dynamic style lookups are valid in React Native and cannot be statically resolved.
      'react-native/no-unused-styles': 'off',
      'no-console': 'warn',
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
];
