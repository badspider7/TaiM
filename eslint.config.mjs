// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': 'off',
    'n/prefer-global/process': ['off'],
    'unused-imports/no-unused-vars': 'off',
    'jsonc/no-useless-escape': 'off',
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/no-empty-object-type': 'off',
  },
})
