import { Transaction } from "sequelize";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { ErrorFactory } from "./errorFactory";
import { ErrorTypes } from "./errorFactory";
import User from "../models/User";


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

// 
export async function checkSufficientUserCredit(userRepository: IUserRepository, userId: string, requiredCredit: number, transaction?: Transaction): Promise<User>{
    const user = await userRepository.getUserById(userId, transaction);
    if (!user) {
        throw ErrorFactory.createError(ErrorTypes.NotFound, "User not found");
    }
    if (user.tokenCredit < requiredCredit) {
        throw ErrorFactory.createError(ErrorTypes.InsufficientCreditError, 'Insufficient credit');
    }
    return user;
}