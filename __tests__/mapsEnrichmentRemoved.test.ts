import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')

function sourceFiles(directory: string): string[] {
    const files: string[] = []

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist') {
                continue
            }

            files.push(...sourceFiles(fullPath))
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.graphql')) {
            files.push(fullPath)
        }
    }

    return files
}

describe('Maps URL enrichment stays removed', () => {
    it('has no Puppeteer helper and no production caller', () => {
        expect(fs.existsSync(path.join(root, 'utils/submissionDataFromGoogleMaps.ts'))).toBe(false)

        const packageJson = fs.readFileSync(path.join(root, 'package.json'), 'utf8')

        expect(packageJson).not.toContain('puppeteer')

        const scanned = [
            ...sourceFiles(path.join(root, 'src')),
            ...sourceFiles(path.join(root, 'utils'))
        ]
        const forbidden = ['puppeteer', 'getFacilityDetailsForSubmission', 'submissionDataFromGoogleMaps', 'autoFillPlacesInformation', 'moderationPanelUpdateSubmission']
        const offenders = scanned.filter(file => {
            const text = fs.readFileSync(file, 'utf8')

            return forbidden.some(token => text.includes(token))
        })

        expect(offenders).toEqual([])
    })
})
