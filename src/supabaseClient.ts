import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { envVariables } from '../utils/environmentVariables.js'
import { logger } from './logger.js'

const url = envVariables.supabaseUrl()
const serviceKey = envVariables.supabaseServiceRoleKey()

export let supabaseClient: SupabaseClient

const testSupabaseIsInitialized = async () => {
    try {
        const { error } = await supabaseClient.from('user').select('id').limit(1)

        if (error) {
            throw new Error(`Error testing initialized supabase client: ${error}`)
        }
    } catch (ex) {
        logger.error(`❌ Supabase is not connecting... ❌ ${ex}'`)
        throw new Error('❌ Supabase is not connecting... ❌')
    }
}

let alreadyStartedInitialization = false

export const initializeSupabaseClient = async () => {
    if (supabaseClient || alreadyStartedInitialization) {
        return
    }

    alreadyStartedInitialization = true

    if (!url) {
        logger.error('❌ Missing supabase env variables, abandoning supabase client initialization ❌ ')
        return
    }
    if (!serviceKey) {
        logger.error('❌ Missing supabase env variables, abandoning supabase client initialization ❌')
        return
    }

    const newSupabaseClient = createClient(url, serviceKey)

    supabaseClient = newSupabaseClient

    await testSupabaseIsInitialized()

    logger.info('✅ Supabase client is initialized! ✅ \n')
}
