/* eslint-disable no-console */
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'

// loads a CSV file from the filesystem, ready for parsing
export default function loadCSVFromFile(filename: string, discardHeader = true, delimiter = ',') {
    try {
        const input = fs.readFileSync(filename)

        // Initialize the parser
        const records: string[][] = parse(input, {
            delimiter
        })

        if (discardHeader) {
            return records.slice(1)
        }

        return records
    } catch (e) {
        console.error('Problem loading CSV: ', e)
        throw (e)
    }
}
