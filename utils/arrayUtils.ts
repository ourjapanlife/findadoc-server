export type ComparablePrimitive = string | number | boolean

/**
 * Compares two primitive values (string, number, or boolean) to determine their order.
 * This is a standard comparison function used by JavaScript's Array.prototype.sort().
 * @param valA The first value to compare.
 * @param valB The second value to compare.
 * @returns -1 if valA comes before valB, 1 if valA comes after valB, and 0 if they are equal.
 */
export const comparePrimitiveValues = (valA: ComparablePrimitive, valB: ComparablePrimitive): number => {
    if (valA < valB) {
        return -1
    } else if (valA > valB) {
        return 1
    }
    return 0
}

export function removeDuplicates<T>(inputArray: T[]): T[] {
    return inputArray.reduce((dedupedArray: T[], currentItem: T) => {
        if (!dedupedArray.includes(currentItem)) {
            dedupedArray.push(currentItem)
        }

        return dedupedArray
    }, [])
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size))
}

/**
 * Sorts an array of objects based on a series of specified ordering criteria.
 * This function allows for multi-level sorting example by name or date
 * It also handles cases where values might be null or undefined, placing them first.
 *
 * @param arrayToSort The array of objects to be sorted.
 * @param orderBy An array of objects defining the sorting fields and their directions ('ASC' or 'DESC').
 * @returns A new sorted array.
 * @throws An error if a field to be sorted contains a non-comparable type
 */
export function sortArrayByOrderCriteria<T extends Record<string, any>>(
    arrayToSort: T[],
    orderBy: Array<{ fieldToOrder: keyof T, orderDirection: 'ASC' | 'DESC' }> | null | undefined
): T[] {
    // If no sorting criteria are provided, return the original array without sorting.
    if (!orderBy || !Array.isArray(orderBy) || orderBy.length === 0) {
        return arrayToSort
    }

    return arrayToSort.sort((a, b) => {
        for (const orderCriterion of orderBy) {
            const fieldName = orderCriterion.fieldToOrder
            const valueA = a[fieldName]
            const valueB = b[fieldName]
            let currentComparison = 0

            // Handle null/undefined values, considering them 'less than' any other value.
            if (valueA === undefined || valueA === null) {
                currentComparison = (valueB === undefined || valueB === null) ? 0 : -1
            } else if (valueB === undefined || valueB === null) {
                currentComparison = 1
            } else {
                const isValueAComparable = typeof valueA === 'string' || typeof valueA === 'number' || typeof valueA === 'boolean'
                const isValueBComparable = typeof valueB === 'string' || typeof valueB === 'number' || typeof valueB === 'boolean'

                if (isValueAComparable && isValueBComparable) {
                    currentComparison = comparePrimitiveValues(valueA as ComparablePrimitive, valueB as ComparablePrimitive)
                } else {
                    throw new Error(`Sorting by field '${String(fieldName)}' is not supported. It contains a non-comparable type (e.g., object or array).`)
                }
            }

             // Reverse the comparison result if the sorting direction is descending.
            if (orderCriterion.orderDirection === 'DESC') {
                currentComparison *= -1
            }

            // If a comparison result is non-zero, it means we found a possible order
            if (currentComparison !== 0) {
                return currentComparison
            }
        }
        // If the loop completes, all sorting criteria were equal, so the items are equal.
        return 0
    })
}
