import { gql } from 'graphql-tag'
import fs from 'fs'
import { DocumentNode } from 'graphql'
import path from 'path'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url))

export default function loadSchema(): DocumentNode {
    try {
        const typeString = fs.readFileSync(
            path.join(__dirname, './typeDefs/schema.graphql'),
            'utf-8'
        )

        const schema = gql`${typeString}`

        logger.debug('📜 Loaded graphql schema')
        return schema
    } catch (e) {
        logger.error(`ERROR: error loading schema ${e}`)
        throw new Error('❌ Unable to load graphql schema ❌')
    }
}
