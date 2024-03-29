import { createLogger, transports, format, Logger } from 'winston'
import LokiTransport from 'winston-loki'
import { envVariables } from '../utils/environmentVariables.js'

export let logger: Logger

export const initializeLogger = () => {
    // eslint-disable-next-line no-console
    console.log('🔊 Initializing logger...')

    if (logger) {
        return
    }

    const combinedTransports = []

    if (envVariables.isProduction()) {
        //we still want to log to the console on the production machine
        const prodMachineLogsTransport = new transports.Console({
            format: format.combine(format.simple(), format.colorize()),
            level: 'debug'
        })

        //this is the production log transport that sends to grafana cloud. 
        const prodGrafanaTransport = new LokiTransport({
            host: envVariables.loggerGrafanaURL(),
            basicAuth: envVariables.loggerGrafanaApiKey(),
            labels: { app: 'findadocjp' },
            json: true,
            format: format.json(),
            replaceTimestamp: true,
            timeout: 10000,
            // eslint-disable-next-line no-console
            onConnectionError: err => console.error(`error connecting to grafana logger: ${err}`)
        })

        combinedTransports.push(prodMachineLogsTransport)
        combinedTransports.push(prodGrafanaTransport)
    } else {
        //during local development, we just want to log to the console
        const localDevTransport = new transports.Console({
            format: format.combine(format.simple(), format.colorize()),
            level: 'debug'
        })

        combinedTransports.push(localDevTransport)
    }
    logger = createLogger({
        transports: combinedTransports
    })
}
