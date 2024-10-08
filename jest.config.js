const jestTypescriptConfig = require('@mixmaxhq/jest-coverage-config/typescript');

module.exports = {
  ...jestTypescriptConfig,
  collectCoverageFrom: ['src/**/*.{ts,js}'],
};
