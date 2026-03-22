import { createLogger, transports, format, Logger } from 'winston'
import { envVariables } from '../utils/environmentVariables.js'

export let logger: Logger

export const initializeLogger = () => {
    // eslint-disable-next-line no-console
    console.log('🔊 Initializing logger...')

    if (logger) {
        return
    }

    if (envVariables.isProduction()) {
        // In production, log JSON to stdout so the Promtail sidecar can collect
        // container logs and forward them to Grafana Loki asynchronously.
        logger = createLogger({
            transports: [
                new transports.Console({
                    format: format.combine(format.timestamp(), format.json()),
                    level: 'debug'
                })
            ]
        })
    } else {
        // During local development, use human-readable colorized output.
        logger = createLogger({
            transports: [
                new transports.Console({
                    format: format.combine(format.simple(), format.colorize()),
                    level: 'debug'
                })
            ]
        })
    }
}
