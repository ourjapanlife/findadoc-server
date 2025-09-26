import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import * as userService from './userService.js'

// temporarily using in-memory database for testing reservation service before using Supabase
const reservations: Array<gqlTypes.Reservation> = []

/**
 * Gets a reservation from the database that matches on the id.
 * @param id A string that matches the id of the Reservation.
 * @returns A Reservation object.
 */
export async function getReservationById(id: string)
    : Promise<Result<gqlTypes.Reservation>> {
    try {
        const selectedReservation = reservations.find(r => r.id === id)

        if (!selectedReservation) {
            throw new Error(`No reservation found with id: ${id}`)
        }
        return {
            data: selectedReservation,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error getting user by id: ${error}`)

        return {
            data: {} as gqlTypes.Reservation,
            hasErrors: true,
            errors: [{
                field: 'getReservationById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Creates a Reservation.
 * @param input the new Reservation object
 * @returns the newly created Reservation so you don't have to query it after
 */
export async function createReservation(
    input: gqlTypes.CreateReservationInput
): Promise<Result<gqlTypes.Reservation>> {
    try {
        // check if user exists that is trying to make reservation
        const userResult = await userService.getUserById(input.userId)
        const userData = userResult.data

        if (userData.id !== input.userId) {
            throw new Error('No user exists with that id')
        }

        const newCreatedDate = new Date().toISOString()
        const newUpdatedDate = new Date().toISOString()
        const newIdNum = reservations.length + 1
        const newId = String(newIdNum)

        const createdReservationResult:gqlTypes.Reservation = {
            createdDate: newCreatedDate,
            id: newId,
            status: gqlTypes.ReservationStatus.Booked,
            updatedDate: newUpdatedDate,
            userId: input.userId
        }

        reservations.push(createdReservationResult)
        return {
            data: createdReservationResult,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error creating reservation: ${error}`)

        return {
            data: {} as gqlTypes.Reservation,
            hasErrors: true,
            errors: [{
                field: 'createReservation',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}
