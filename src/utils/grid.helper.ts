import { Transaction } from "sequelize";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { ErrorFactory } from "./errorFactory";
import { ErrorTypes } from "./errorFactory";
import User from "../models/User";
import { IUpdateRequestRepository } from "../interfaces/repositories/IUpdateRequestRepository";
import { IGridRepository } from "../interfaces/repositories/IGridRepository";

/**
 * Cost in tokens required to create a new grid cell.
 */
export const COST_PER_CELL_CREATION = 0.025;

/**
 * Cost in tokens required to update an existing grid cell.
 */
export const COST_PER_CELL_UPDATE = 0.3;

/**
 * Compares two matrices and counts how many cells differ.
 *
 * @param matrixA The first matrix to compare.
 * @param matrixB The second matrix to compare.
 * @returns The number of cells whose values are different.
 * @throws ErrorFactory.BadRequest If the matrices do not have the same dimensions.
 */
export function countChangedCells(matrixA: number[][], matrixB: number[][]): number {
    let changeCount = 0;

    // Optional: Safety check to ensure dimensions match
    if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
        throw ErrorFactory.createError(ErrorTypes.BadRequest, "matrix must match the original size");
    }

    for (let row = 0; row < matrixA.length; row++) {
        for (let col = 0; col < matrixA[row].length; col++) {
            // Compare the cell values
            if (matrixA[row][col] !== matrixB[row][col]) {
                changeCount++;
            }
        }
    }

    return changeCount;
}

/**
 * Verifies that the user has enough credit to perform an operation.
 *
 * @param userRepository Repository used to retrieve the user profile.
 * @param userId Identifier of the user to validate.
 * @param requiredCredit Minimum credit required for the operation.
 * @param transaction Optional Sequelize transaction to use for the query.
 * @returns The retrieved user if the credit is sufficient.
 * @throws ErrorFactory.NotFound If the user does not exist.
 * @throws ErrorFactory.InsufficientCreditError If the user does not have enough credit.
 */
export async function checkSufficientUserCredit(userRepository: IUserRepository, userId: string, requiredCredit: number, transaction?: Transaction): Promise<User> {
    const user = await userRepository.getUserById(userId, transaction);
    if (!user) {
        throw ErrorFactory.createError(ErrorTypes.NotFound, "User not found");
    }
    if (user.tokenCredit < requiredCredit) {
        throw ErrorFactory.createError(ErrorTypes.InsufficientCreditError, 'Insufficient credit');
    }
    return user;
}

/**
 * Checks whether the current user is the owner of the grid associated with an update request.
 *
 * @param requestId Identifier of the update request.
 * @param currentUserId Identifier of the user attempting the operation.
 * @param updateRequestRepository Repository for update requests.
 * @param gridRepository Repository for grids.
 * @returns True if the current user is the grid owner, otherwise false.
 * @throws ErrorFactory.NotFound If the update request does not exist.
 */
export async function checkOwner(requestId: string, currentUserId: string, updateRequestRepository: IUpdateRequestRepository, gridRepository: IGridRepository): Promise<boolean> {
    // Get the update request from db
    const updateRequest = await updateRequestRepository.getUpdateRequestById(requestId);
    if (!updateRequest) {
        throw ErrorFactory.createError(ErrorTypes.NotFound, 'Update request not found');
    }
    // Get the grid that is gonna be updated
    const gridId = updateRequest?.modelId;
    const grid = await gridRepository.getGridById(gridId);

    //check if the current user is the owner that can accept/reject the request
    const ownerId = grid?.ownerId;
    return currentUserId === ownerId;
}