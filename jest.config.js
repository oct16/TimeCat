module.exports = {
    preset: 'ts-jest',
    rootDir: __dirname,
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest'
    },
    coverageDirectory: 'coverage',
    coverageReporters: ['html', 'lcov', 'text'],
    watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
    // testRegex: '(/unit/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    moduleNameMapper: {
        '^@timecat/(.*?)$': '<rootDir>/packages/$1/src',
        'packages/(.*)$': '<rootDir>/packages/$1',
        pkg: '<rootDir>/package.json'
    },
    testMatch: ['<rootDir>/packages/**/__tests__/**/*spec.[jt]s?(x)'],
    testPathIgnorePatterns: process.env.SKIP_E2E ? ['/node_modules/', '/examples/__tests__'] : ['/node_modules/'],
    verbose: true,
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/jest-setup.js', 'jest-canvas-mock']
}
