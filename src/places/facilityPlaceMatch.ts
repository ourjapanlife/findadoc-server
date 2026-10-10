/** Compare our clinic name with a live Google name. Short shared words are not a match. */
export function namesAgree(
    facilityNames: Array<string | null | undefined>,
    googleName: string | null | undefined
): boolean {
    const google = normalizePlaceName(googleName ?? '')
    if (google.length < 8) { return false }

    return facilityNames.some(name => {
        const ours = normalizePlaceName(name ?? '')
        if (ours.length < 8) { return false }
        if (ours === google) { return true }

        const shorter = ours.length < google.length ? ours : google
        const longer = ours.length < google.length ? google : ours
        return shorter.length >= 8 && longer.includes(shorter)
    })
}

export function normalizePlaceName(value: string): string {
    return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}
