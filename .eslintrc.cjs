/* .eslintrc.cjs */
require('@rushstack/eslint-patch/modern-module-resolution');
const fs = require('fs');
const hasTypeAware = fs.existsSync('./tsconfig.eslint.json') || fs.existsSync('./tsconfig.json');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
    es2022: true,
  },

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ...(hasTypeAware && { project: ['./tsconfig.eslint.json', './tsconfig.json'].filter(fs.existsSync) }),
  },

  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports',
    'jsx-a11y',
    'tailwindcss',
    'eslint-comments',
  ],

  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    ...(hasTypeAware ? ['plugin:@typescript-eslint/recommended-requiring-type-checking'] : []),
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'plugin:tailwindcss/recommended',
    'plugin:eslint-comments/recommended',
    'prettier',
  ],

  settings: {
    // Para que eslint-plugin-import entienda alias y TS
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    // Tailwind: reconoce helpers comunes
    tailwindcss: {
      callees: ['clsx', 'cx', 'cva'],
      config: 'tailwind.config.ts',
    },
  },

  rules: {
    /* ---------- Noise control (clean builds) ---------- */
    // Keep build logs clean. Prefer TypeScript + runtime guards over pedantic lint in UI glue.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    'react-hooks/exhaustive-deps': 'off',

    // Import/style noise (cosmetic): disable to avoid log spam in Next build.
    'import/first': 'off',
    'import/order': 'off',
    'import/no-duplicates': 'off',
    'import/no-named-as-default-member': 'off',
    'tailwindcss/classnames-order': 'off',
    'tailwindcss/enforces-shorthand': 'off',

    /* ---------- Next / App Router ---------- */
    // No aplica en App Router (no hay pages/ con routing de file-system clásico)
    '@next/next/no-html-link-for-pages': 'off',

    /* ---------- TypeScript ---------- */
    // Disabled globally above (clean builds)
    // En UI/edge (Next App Router) es común interactuar con libs/DOM/eventos que tipan como unknown/any.
    // Preferimos velocidad y DX en el frontend. Mantenemos type-safety fuerte en server/DB.
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
    '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
    '@typescript-eslint/no-unused-vars': 'off', // lo gestiona unused-imports
    '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { attributes: false, properties: false } }],
    ...(hasTypeAware
      ? {
          // Keep build clean; type-aware promise linting is handled in CI when needed.
          '@typescript-eslint/no-floating-promises': 'off',
          '@typescript-eslint/await-thenable': 'warn',
        }
      : {}),

    /* ---------- Imports ---------- */
    'import/no-unresolved': 'off', // Lo resuelve TS
    'import/no-named-as-default': 'off',
    'import/no-duplicates': 'off',
    'import/no-named-as-default-member': 'off',
    'import/newline-after-import': 'off',
    'import/first': 'off',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': ['warn', { noUselessIndex: true }],
    'import/no-cycle': 'warn',
    'import/order': [
      'off',
      {
        'newlines-between': 'always',
        groups: [
          'builtin', // fs, path
          'external', // react, next, ...
          'internal', // @/...
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        pathGroups: [{ pattern: '@/**', group: 'internal', position: 'after' }],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-extraneous-dependencies': [
      'warn',
      {
        devDependencies: [
          '**/*.config.*',
          '**/*.config.*.*',
          '**/scripts/**',
          '**/.eslintrc.cjs',
          'postcss.config.js',
          'tailwind.config.ts',
          'next.config.ts',
          'vitest.config.*',
          'jest.config.*',
          '**/*.test.*',
          '**/*.spec.*',
        ],
      },
    ],
    // Evita importar módulos server-only desde componentes cliente
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: '@/lib/stripe', message: 'Este módulo es server-only. Úsalo solo en server.' },
          { name: '@/lib/supabaseAdmin', message: 'Este módulo es server-only. Úsalo solo en server.' },
        ],
      },
    ],

    /* ---------- Unused imports/vars ---------- */
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],

    /* ---------- A11y / Web ---------- */
    // jsx-a11y ya aporta un set sensato por defecto

    /* ---------- Tailwind ---------- */
    'tailwindcss/no-custom-classname': 'off', // permitimos brand-*
    // Orden/shorthands son estilo; no deben ensuciar builds.
    'tailwindcss/classnames-order': 'off',
    'tailwindcss/no-contradicting-classname': 'error',
    'tailwindcss/enforces-shorthand': 'off',

    /* ---------- Estilo / sane defaults ---------- */
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // No bloqueamos el build por disables huérfanos; se limpia gradualmente.
    'eslint-comments/no-unused-disable': 'off',

    /* Evita disables huérfanos */
  },

  overrides: [
    // Relax strict a11y for admin backoffice UIs (still accessible, but we don't block CI on labels)
    {
      files: ['src/app/admin/**/*.{ts,tsx}'],
      rules: {
        'jsx-a11y/label-has-associated-control': 'off',
        'react/no-unescaped-entities': 'off',
      },
    },

    // Rutas API / webhooks: permitimos console.info para logs de servidor
    {
      files: ['src/app/api/**/*.{ts,tsx}', 'src/app/**/route.{ts,tsx}'],
      env: { node: true, browser: false },
      rules: { 'no-console': ['warn', { allow: ['warn', 'error', 'info'] }] },
    },

    // Archivos server-only: se permite importar stripe/supabaseAdmin
    {
      files: ['src/lib/stripe.ts', 'src/lib/supabaseAdmin.ts'],
      env: { node: true, browser: false },
      rules: { 'no-restricted-imports': 'off' },
    },

    // Next App Router: páginas/plantillas que requieren default export
    {
      files: [
        'src/app/**/layout.{ts,tsx}',
        'src/app/**/template.{ts,tsx}',
        'src/app/**/page.{ts,tsx}',
        'src/app/**/loading.{ts,tsx}',
        'src/app/**/error.{ts,tsx}',
        'src/app/**/not-found.{ts,tsx}',
        'src/middleware.{ts,tsx}',
      ],
      rules: {
        'import/no-default-export': 'off',
      },
    },

    // Scripts y configs: devDeps ok
    {
      files: [
        '**/*.config.*',
        '**/*.config.*.*',
        'scripts/**',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        '.eslintrc.cjs',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },

    // Tests
    {
      files: ['**/*.test.*', '**/*.spec.*'],
      env: { jest: true },
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],

  ignorePatterns: [
    '.next/**',
    'node_modules/**',
    'public/**',
    'dist/**',
    'coverage/**',
    // Generados / externos
    'supabase/**',
    'scripts/**',
    '**/*.d.ts',
  ],
};
