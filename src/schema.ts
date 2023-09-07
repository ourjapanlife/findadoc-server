import { gql } from 'graphql-tag'

import fs from 'fs'
import { DocumentNode } from 'graphql'
import path from 'path'

export default function loadSchema(): DocumentNode {
    try {
        const typeString = fs.readFileSync(
            path.join(__dirname, './typeDefs/schema.graphql'),
            'utf-8'
        )

        const schema = gql`${typeString}`

        console.log('📜 Loaded graphql schema')
        return schema
    } catch (e) {
        console.log(e)
        throw new Error('❌ Unable to load graphql schema ❌')
    }
}
