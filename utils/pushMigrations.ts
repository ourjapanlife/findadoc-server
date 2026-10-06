import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { envVariables } from './environmentVariables.js'

if (!existsSync('supabase/.temp/project-ref')) {
    console.error('Link this repo to the hosted project once with `npx supabase login` and `npx supabase link`, then deploy again.')
    process.exit(1)
}

const password = envVariables.pgPassword()
const env = { ...process.env }
if (password) {
    env.SUPABASE_DB_PASSWORD = password
}

// https://supabase.com/docs/guides/deployment/database-migrations
// Applies migration files that are not already in supabase_migrations.schema_migrations.
const result = spawnSync(
    'npx',
    ['supabase', 'db', 'push', '--yes'],
    { stdio: 'inherit', shell: process.platform === 'win32', env }
)

if (result.error) {
    console.error('The Supabase CLI is required to apply migrations.')
    process.exit(1)
}

process.exit(result.status ?? 1)
