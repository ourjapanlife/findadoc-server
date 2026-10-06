import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

function loadEnv(path) {
    if (!existsSync(path)) {
        return
    }
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
            continue
        }
        const index = trimmed.indexOf('=')
        const key = trimmed.slice(0, index).trim()
        let value = trimmed.slice(index + 1).trim()
        if (
            (value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1)
        }
        if (process.env[key] === undefined) {
            process.env[key] = value
        }
    }
}

loadEnv('.env.prod')
loadEnv('.env')

function connectionString() {
    const explicit = process.env.SUPABASE_DB_URL || process.env.DB_URL || ''
    if (explicit.startsWith('postgres')) {
        return explicit
    }
    const user = process.env.PGUSER
    const password = process.env.PGPASSWORD
    const host = process.env.PGHOST
    if (!user || !password || !host) {
        return ''
    }
    const database = process.env.PGDATABASE || 'postgres'
    // The API uses the transaction pooler on 6543. Migrations need a session connection.
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:5432/${database}`
}

const dbUrl = connectionString()
if (!dbUrl) {
    console.error('Set SUPABASE_DB_URL, or PGHOST, PGUSER, and PGPASSWORD, before deploying so new migrations can be applied.')
    process.exit(1)
}

const useProjectCli = existsSync('node_modules/supabase/bin/supabase')
    || existsSync('node_modules/supabase/bin/supabase.exe')
const command = useProjectCli ? 'yarn' : 'supabase'
const args = useProjectCli
    ? ['supabase', 'db', 'push', '--db-url', dbUrl, '--linked=false', '--yes']
    : ['db', 'push', '--db-url', dbUrl, '--linked=false', '--yes']

const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
if (result.error) {
    console.error('The Supabase CLI is required to apply migrations.')
    process.exit(1)
}
process.exit(result.status ?? 1)
