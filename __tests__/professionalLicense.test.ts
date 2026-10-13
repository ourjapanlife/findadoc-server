import { describe, expect, it } from 'vitest'
import { Degree } from '../src/typeDefs/gqlTypes.js'
import {
    HIDDEN_FROM_PICKER,
    LicenseRecommendation,
    LicenseReview,
    licenseColumnsForDegrees,
    planStoredLicense,
    reportStoredLicenses,
    type StoredLicenseRow
} from '../src/licenses/professionalLicense.js'

function row(degrees: string[], extras: Partial<StoredLicenseRow> = {}): StoredLicenseRow {
    return {
        degrees,
        primaryLicense: null,
        additionalCredentials: [],
        licenseReview: null,
        licenseRecommendation: null,
        ...extras
    }
}

describe('planStoredLicense', () => {
    it('splits one clinical license from extra credentials', () => {
        expect(planStoredLicense(row([Degree.Md, Degree.PhD, Degree.Mph]))).toEqual({
            action: 'split',
            columns: {
                degrees: [Degree.Md, Degree.PhD, Degree.Mph],
                primaryLicense: Degree.Md,
                additionalCredentials: [Degree.PhD, Degree.Mph],
                licenseReview: null,
                licenseRecommendation: null
            }
        })
    })

    it('queues MD and DO with an MD suggestion and does not choose a primary', () => {
        const plan = planStoredLicense(row([Degree.Do, Degree.Md, Degree.PhD]))

        expect(plan).toMatchObject({
            action: 'needs_review',
            columns: {
                primaryLicense: null,
                additionalCredentials: [Degree.PhD],
                licenseReview: LicenseReview.NeedsReview,
                licenseRecommendation: LicenseRecommendation.Md
            }
        })
        expect(plan).not.toHaveProperty('degrees')
    })

    it('queues DDS and DMD without picking either dental license', () => {
        const plan = planStoredLicense(row([Degree.Dds, Degree.Dmd]))

        expect(plan).toMatchObject({
            action: 'needs_review',
            columns: {
                primaryLicense: null,
                licenseRecommendation: LicenseRecommendation.OneDentalLicense
            }
        })
    })

    it('leaves a confirmed dual license unchanged', () => {
        expect(planStoredLicense(row([Degree.Md, Degree.Do], {
            licenseReview: LicenseReview.Confirmed
        }))).toEqual({ action: 'keep', reason: 'confirmed_dual' })
    })

    it('does not replace a primary license that is already stored', () => {
        expect(planStoredLicense(row([Degree.Md, Degree.Do], {
            primaryLicense: Degree.Md
        }))).toEqual({ action: 'keep', reason: 'unchanged' })
    })

    it('does not invent MD for an existing row that has no clinical license', () => {
        expect(planStoredLicense(row([Degree.PhD]))).toMatchObject({
            action: 'split',
            columns: {
                primaryLicense: null,
                additionalCredentials: [Degree.PhD]
            }
        })
        expect(planStoredLicense(row([]))).toEqual({ action: 'keep', reason: 'unchanged' })
        expect(planStoredLicense(row([Degree.Dvm]))).toEqual({ action: 'keep', reason: 'unchanged' })
    })
})

describe('licenseColumnsForDegrees', () => {
    it('keeps a repeated degree in the stored list', () => {
        expect(licenseColumnsForDegrees([Degree.PhD, Degree.PhD]).degrees).toEqual([Degree.PhD, Degree.PhD])
    })

    it('keeps a stored primary that is still in the submitted degrees', () => {
        expect(licenseColumnsForDegrees([Degree.Md, Degree.Do], {
            primaryLicense: Degree.Md,
            licenseReview: null
        })).toMatchObject({
            primaryLicense: Degree.Md,
            licenseReview: null,
            licenseRecommendation: null
        })
    })

    it('keeps that primary when the moderator confirms the row', () => {
        expect(licenseColumnsForDegrees([Degree.Md, Degree.Do], {
            confirmed: true,
            primaryLicense: Degree.Md,
            licenseReview: LicenseReview.Confirmed
        })).toMatchObject({
            primaryLicense: Degree.Md,
            licenseReview: LicenseReview.Confirmed
        })
    })

    it('does not invent MD when the moderator has not chosen a license', () => {
        expect(licenseColumnsForDegrees([])).toMatchObject({
            degrees: [],
            primaryLicense: null,
            licenseReview: null
        })
        expect(licenseColumnsForDegrees([Degree.PhD])).toMatchObject({
            degrees: [Degree.PhD],
            primaryLicense: null,
            additionalCredentials: [Degree.PhD]
        })
    })
})

describe('reportStoredLicenses', () => {
    it('counts the dual-license queue from the rows it was given', () => {
        const report = reportStoredLicenses([
            row([Degree.Md]),
            row([Degree.Dds, Degree.Dmd]),
            row([Degree.Dmd, Degree.Dds]),
            row([Degree.Md, Degree.Do]),
            row([Degree.Md, Degree.Do], { licenseReview: LicenseReview.Confirmed })
        ])

        expect(report.total).toBe(5)
        expect(report.split).toBe(1)
        expect(report.needsReview[LicenseRecommendation.OneDentalLicense]).toBe(2)
        expect(report.needsReview[LicenseRecommendation.Md]).toBe(1)
        expect(report.confirmed).toBe(1)
        expect(HIDDEN_FROM_PICKER).toEqual([Degree.Dsw, Degree.Dvm, Degree.EdD])
    })
})
