import { spawnSync } from 'node:child_process'
import { envVariables } from './environmentVariables.js'

function connectionString(): string {
    const explicit = envVariables.dbUrl() ?? ''
    if (explicit.startsWith('postgresql://') || explicit.startsWith('postgres://')) {
        return explicit
    }

    const user = envVariables.pgUser()
    const password = envVariables.pgPassword()
    const host = envVariables.pgHost()
    if (!user || !password || !host) {
        return ''
    }

    // The API uses the transaction pooler on 6543. Migrations need a session connection.
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:5432/postgres`
}

const dbUrl = connectionString()
if (!dbUrl) {
    console.error('Set DB_URL to a postgres URL, or PGHOST, PGUSER, and PGPASSWORD, before deploying so new migrations can be applied.')
    process.exit(1)
}

const result = spawnSync(
    'npx',
    ['supabase', 'db', 'push', '--db-url', dbUrl, '--linked=false', '--yes'],
    { stdio: 'inherit', shell: process.platform === 'win32' }
)

if (result.error) {
    console.error('The Supabase CLI is required to apply migrations.')
    process.exit(1)
}

process.exit(result.status ?? 1)
