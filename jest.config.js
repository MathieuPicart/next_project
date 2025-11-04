module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/database'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'database/**/*.{ts,tsx}',
    '!database/**/*.d.ts',
    '!database/**/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  testTimeout: 30000,
};
