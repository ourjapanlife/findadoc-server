import { mapped, needsReview, type MapOutcome } from './types.js'

/** Controlled brand list from the approved data-cleaning plan. Suica and PASMO share IC. */
export const PAYMENT_BRANDS = [
    'Visa',
    'Mastercard',
    'American Express',
    'JCB',
    'Diners Club',
    'UnionPay',
    'IC',
    'PayPay',
    'Other'
] as const

export type PaymentBrand = typeof PAYMENT_BRANDS[number]

export type PaymentBrandMatch = {
    brand: PaymentBrand
    /** Set when the source is a real brand we file under Other, so the source is not lost. */
    note?: string
}

const BRAND_ALIASES: Record<string, PaymentBrandMatch> = {
    VISA: { brand: 'Visa' },
    MASTERCARD: { brand: 'Mastercard' },
    MASTER: { brand: 'Mastercard' },
    'AMERICAN EXPRESS': { brand: 'American Express' },
    AMEX: { brand: 'American Express' },
    JCB: { brand: 'JCB' },
    'DINERS CLUB': { brand: 'Diners Club' },
    DINERS: { brand: 'Diners Club' },
    UNIONPAY: { brand: 'UnionPay' },
    'UNION PAY': { brand: 'UnionPay' },
    SUICA: { brand: 'IC' },
    PASMO: { brand: 'IC' },
    IC: { brand: 'IC' },
    PAYPAY: { brand: 'PayPay' },
    OTHER: { brand: 'Other' },
    COINEY: { brand: 'Other', note: 'Coiney' }
}

function brandKey(source: string): string {
    return source.trim().replace(/\./g, '').replace(/\s+/g, ' ').toUpperCase()
}

/** Map a spreadsheet or free-text brand onto the controlled list. */
export function mapPaymentBrand(source: string): MapOutcome<PaymentBrandMatch> {
    const key = brandKey(source)

    if (!key) {
        return needsReview('empty')
    }

    const match = BRAND_ALIASES[key]

    if (!match) {
        return needsReview('unmapped_brand')
    }

    return mapped(match)
}
