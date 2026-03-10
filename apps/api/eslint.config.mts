import { composeConfig } from '@workspace/eslint-config'

const baseConfig = composeConfig({
  typescript: {
    tsconfigRootDir: import.meta.dirname,
  },
  prettier: true,
  packageJson: {
    overrides: {
      'package-json/valid-devDependencies': 'off',
    },
  },
  vitest: true,
  boundaries: {
    preset: 'modules',
  },
  unicorn: {
    overrides: {
      'unicorn/no-null': 'off',
    },
  },
  imports: {
    overrides: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', '../**'],
              message: 'Use @/ path alias instead of ../ relative imports',
            },
          ],
        },
      ],
    },
  },
})

export default [
  ...baseConfig,
  {
    files: ['**/schemas/*.schema.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Test files live outside src/ so they cannot use @/ path aliases
    files: ['test/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/modules/auth/**/*.ts'],
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: ['module'],
              allow: [
                'app',
                'shared-kernel',
                ['module', { moduleName: 'auth' }],
                ['module', { moduleName: 'profile' }],
              ],
            },
          ],
        },
      ],
    },
  },
]
