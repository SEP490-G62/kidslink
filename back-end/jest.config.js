module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/models/**',
    '!src/config/**'
  ]
};
