module.exports = {
    preset: 'ts-jest',
    setupFiles: ['dotenv/config', '<rootDir>/.env.dev'],
    testEnvironment: 'node',
    testTimeout: 40000,
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    transformIgnorePatterns: ['~/node_modules/']
}
