import { config } from 'dotenv'

const dotEnvFileToLoad = process.env.NODE_ENV === 'prod' ? './.env.prod' : './.env.dev'

config({ path: dotEnvFileToLoad })

const envVariables = {
    isProduction: () => process.env.NODE_ENV === 'prod',
    isLocal: () => process.env.NODE_ENV !== 'prod',
    getDbUrl: () => process.env.FIRESTORE_EMULATOR_HOST
}

export {envVariables}
