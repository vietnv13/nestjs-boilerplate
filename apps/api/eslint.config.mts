import { composeConfig } from '@workspace/eslint-config'

const baseConfig = composeConfig({
  typescript: {
    tsconfigRootDir: import.meta.dirname,
  },
  prettier: false,
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
