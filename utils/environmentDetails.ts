const envDetails = {
    isProduction: () => process.env.stage === 'prod',
    isDevelop: () => process.env.stage === 'dev',
    getDbUrl: () => process.env.FIRESTORE_EMULATOR_HOST
}

export {envDetails}
