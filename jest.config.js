module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/database', '<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'database/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!database/**/*.d.ts',
    '!lib/**/*.d.ts',
    '!database/**/__tests__/**',
    '!lib/**/__tests__/**',
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