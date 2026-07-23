// Flat config (ESLint 9). Linter y formateador van separados: ESLint valida
// calidad/hooks/imports y Prettier se encarga del formato. `eslint-config-prettier`
// va al final para apagar reglas de estilo que chocarían con Prettier.
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'coverage/**',
      'supabase/functions/**', // código Deno, fuera del tsconfig de la app
    ],
  },
  ...expoConfig,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Toda salida de logs debe pasar por el logger central (src/lib/logger.ts).
      'no-console': 'warn',
    },
  },
  eslintConfigPrettier,
  {
    // El logger es el único lugar autorizado para usar console directamente.
    files: ['src/lib/logger.ts'],
    rules: { 'no-console': 'off' },
  },
];
