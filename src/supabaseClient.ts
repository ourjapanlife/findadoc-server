import { createClient } from '@supabase/supabase-js'
import { envVariables } from '../utils/environmentVariables'

const url = envVariables.supabaseUrl()
const serviceKey = envVariables.supabaseServiceRoleKey()

if (!url) {
    throw new Error('Missing env SUPABASE_URL')
}
if (!serviceKey) {
    throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY')
}

export const supabase = createClient(url, serviceKey)
