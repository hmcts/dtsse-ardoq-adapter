module.exports = {
  roots: ['<rootDir>/src/test/unit'],
  testRegex: '(/src/test/.*.(test|spec)).(ts|js)$',
  moduleFileExtensions: ['ts', 'js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coveragePathIgnorePatterns: ['/src/main/modules/properties-volume/*'],
  openHandlesTimeout: 2000,
};
