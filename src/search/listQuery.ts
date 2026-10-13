/** One moderation-list query. Blank means the list is not filtered (#1046). */
export const LIST_QUERY_MAX = 128

export function listQueryValue(query: string | null | undefined): string | null {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) {
        return null
    }

    return trimmed
}

/** LIKE pattern for a contains match. `%`, `_`, and `\` in the query stay literal. */
export function likeContainsPattern(query: string): string {
    return `%${query.replace(/[\\%_]/g, character => `\\${character}`)}%`
}
