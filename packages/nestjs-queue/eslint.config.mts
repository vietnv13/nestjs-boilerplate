import { composeConfig } from '@workspace/eslint-config'

import type { Linter } from 'eslint'

const config: Linter.Config[] = composeConfig({
  typescript: {
    tsconfigRootDir: import.meta.dirname,
  },
  prettier: true,
})

export default config
