module.exports = {
    preset: 'ts-jest',
    setupFiles: ['<rootDir>/.jest/setEnvVars.ts'],
    testEnvironment: 'node',
    testTimeout: 40000,
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    transformIgnorePatterns: ['~/node_modules/']
}
