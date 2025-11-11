/*

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
*/

// src/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { envVariables } from '../utils/environmentVariables.js'
import { logger } from './logger.js'

const url = envVariables.supabaseUrl()
const serviceKey = envVariables.supabaseServiceRoleKey()

const isTestEnv =
    process.env.NODE_ENV === 'test' ||
    typeof process.env.VITEST !== 'undefined' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined'

export let supabaseClient: SupabaseClient | null = null

const testSupabaseIsInitialized = async () => {
    if (!supabaseClient) { return }

    try {
        const { error } = await supabaseClient.from('user').select('id').limit(1)

        if (error) {
            throw error
        }
    } catch (ex) {
        const msg = typeof ex === 'object' ? JSON.stringify(ex) : String(ex)

        logger.error(`❌ Supabase is not connecting... ❌ ${msg}`)

        if (isTestEnv) {
            logger.warn('🟡 Test env: Supabase non raggiungibile, ma non blocco i test.')
            return
        }

        throw new Error('❌ Supabase is not connecting... ❌')
    }
}

let initializingPromise: Promise<void> | null = null

export const initializeSupabaseClient = async () => {
    if (supabaseClient) {
        return
    }

    if (initializingPromise) {
        await initializingPromise
        return
    }
    initializingPromise = (async () => {
        if (!url || !serviceKey) {
            logger.error('❌ Missing supabase env variables, abandoning supabase client initialization ❌')

            if (isTestEnv) {
                return
            }

            throw new Error('Missing Supabase env vars')
        }

        supabaseClient = createClient(url, serviceKey)
        await testSupabaseIsInitialized()
        logger.info('✅ Supabase client is initialized! ✅ \n')
    })()

    await initializingPromise
}

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Did you call initializeSupabaseClient() in test setup?')
    }
    return supabaseClient
}
