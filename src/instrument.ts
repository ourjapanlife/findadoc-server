// This file MUST be imported before any other module so Sentry can
// instrument node built-ins (http, etc.) before they are required.
import * as Sentry from '@sentry/node'
import { envVariables } from '../utils/environmentVariables.js'

const dsn = envVariables.sentryDsn()

if (dsn) {
    Sentry.init({
        dsn,
        environment: envVariables.sentryEnvironment(),
        tracesSampleRate: envVariables.sentryTracesSampleRate(),
        sendDefaultPii: false
    })
    // eslint-disable-next-line no-console
    console.log('🛰️  Sentry initialized')
} else {
    // eslint-disable-next-line no-console
    console.log('🛰️  Sentry DSN not set — skipping Sentry initialization')
}
