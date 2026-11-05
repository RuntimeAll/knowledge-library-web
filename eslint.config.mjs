import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: ts.parser } },
    rules: { 'vue/multi-word-component-names': 'off', 'no-undef': 'off' },
  },
  {
    files: ['**/*.{ts,vue,mjs}'],
    languageOptions: { globals: { uni: 'readonly', UniApp: 'readonly', process: 'readonly', Buffer: 'readonly', console: 'readonly', URL: 'readonly', setTimeout: 'readonly', document: 'readonly', innerWidth: 'readonly', getComputedStyle: 'readonly' } },
  },
);
