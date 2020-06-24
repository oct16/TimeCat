module.exports = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    roots: ['<rootDir>/test'],
    rootDir: __dirname,
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    coverageDirectory: 'coverage',
    coverageReporters: ['html', 'lcov', 'text'],
    watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
    modulePaths: ['packages', 'test'],
    testRegex: '(/unit/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    moduleNameMapper: {
        '^@timecat/(.*?)$': '<rootDir>/packages/$1/src',
        'packages/(.*)$': '<rootDir>/packages/$1'
    },
    verbose: true
}
