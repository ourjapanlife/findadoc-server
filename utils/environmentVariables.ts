import { config } from 'dotenv'

console.log(`\n🔌 Loading environment: ${process.env.NODE_ENV}...`)

const dotEnvFileToLoad = process.env.NODE_ENV === 'production' ? './.env.prod' : './.env.dev'

config({ path: dotEnvFileToLoad })

const envVariables = {
    isProduction: () => process.env.NODE_ENV === 'production',
    isTestingEnvironment: () => process.env.TEST_ENABLED === 'true',
    isLocal: () => !envVariables.isProduction(),
    serverHost: () => process.env.SERVER_HOST as string,
    serverPort: () => process.env.SERVER_PORT as string,
    apiURL: () => process.env.API_URL as string,
    websiteURL: () => process.env.WEBSITE_URL as string,
    loggerGrafanaURL: () => process.env.LOGGER_GRAFANA_URL as string,
    loggerGrafanaApiKey: () => process.env.LOGGER_GRAFANA_API_KEY as string,
    authAuth0APIKey: () => process.env.AUTH_AUTH0_API_KEY as string,
    authAuth0URL: () => process.env.AUTH_AUTH0_URL as string,
    authGithubClientId: () => process.env.AUTH_GITHUB_CLIENT_ID as string,
    authGithubClientSecret: () => process.env.AUTH_GITHUB_CLIENT_SECRET as string,
    googleAPIKey: () => process.env.GOOGLE_API_KEY,
    supabaseUrl: () => process.env.SUPABASE_URL,
    supabaseServiceRoleKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY,
    pgPassword: () => process.env.PGPASSWORD,
    pgUser: () => process.env.PGUSER,
    pgHost: () => process.env.PGHOST,
    dbUrl: () => process.env.DB_URL || process.env.DATABASE_URL,
    pgPort: () => process.env.PGPORT,
    pgDatabase: () => process.env.DATABASE_URL,
    sentryDsn: () => process.env.SENTRY_DSN,
    sentryEnvironment: () =>
        process.env.SENTRY_ENVIRONMENT
        ?? (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    sentryTracesSampleRate: () => {
        const raw = process.env.SENTRY_TRACES_SAMPLE_RATE
        const parsed = raw ? Number(raw) : NaN

        if (!Number.isFinite(parsed)) {
            return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
        }
        return parsed
    }
}

console.log('🔌 Loaded env variables 🔌')

export { envVariables }
