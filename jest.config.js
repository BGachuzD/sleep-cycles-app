// Jest para la capa de dominio pura (src/domain/**). No carga el entorno de
// React Native: estos tests son funciones puras. ts-jest usa un override de
// módulos (commonjs/node) para desacoplarse de la resolución `bundler` que usa
// la app en tsconfig.json.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          isolatedModules: true,
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          strict: true,
        },
      },
    ],
  },
};
