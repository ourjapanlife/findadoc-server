export default {
    preset: 'ts-jest/presets/default-esm',
    setupFiles: ['dotenv/config', '<rootDir>/.env.dev'],
    testTimeout: 40000,
    transform: {
        '^.+\\.ts?$':
            ['ts-jest',
                {
                    useESM: true
                }],
    },
    transformIgnorePatterns: []
}
