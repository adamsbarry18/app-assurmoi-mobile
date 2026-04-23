const expo = require('eslint-config-expo/flat')
const eslintConfigPrettier = require('eslint-config-prettier/flat')
const { defineConfig } = require('eslint/config')

/**
 * @see https://docs.expo.dev/guides/using-eslint/
 */
module.exports = defineConfig([
  ...expo,
  eslintConfigPrettier,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'web-build/**',
      'dist/**',
      'android/**',
      'ios/**',
      '*.lock'
    ]
  }
])
