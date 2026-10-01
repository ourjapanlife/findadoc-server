/**
 * Result of a reviewed vocabulary lookup (#1006).
 * `needs_review` is a real outcome. Callers must not drop it or invent a value.
 */
export type MapOutcome<T> =
    | { status: 'mapped', value: T }
    | { status: 'needs_review', reason: string }

export function mapped<T>(value: T): MapOutcome<T> {
    return { status: 'mapped', value }
}

export function needsReview<T>(reason: string): MapOutcome<T> {
    return { status: 'needs_review', reason }
}
