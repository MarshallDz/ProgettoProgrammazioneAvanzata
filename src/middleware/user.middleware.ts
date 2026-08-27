import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';

/**
 * Creates middleware that verifies whether a user exists by URL id.
 *
 * @param userRepo - User repository used to retrieve the user.
 * @returns Middleware that forwards the request or raises a not-found error.
 */
export function checkUserExists(userRepo: IUserRepository) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params["id"] as string;
        const user = await userRepo.getUserById(id);
        if (!user) {
            throw ErrorFactory.createError(ErrorTypes.NotFound, "User not found");
        }
        next();
    }
};

/**
 * Creates middleware that verifies the authenticated user and available credit.
 *
 * The user id is read from the JWT payload in `req.user`. The request continues
 * only when the user exists and has a positive token credit balance.
 *
 * @param userRepo - User repository used to retrieve the authenticated user.
 * @returns Middleware that forwards the request or an authorization error.
 */
export function checkUserCredit(userRepo: IUserRepository) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Retrieve id from payload of jwt
        const user = req.user;
        if (!user) {
            return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Unauthorized.'));
        }

        // Retrieve user from db
        const userDb = await userRepo.getUserById(user.id);

        if (!userDb) {
            return next(ErrorFactory.createError(ErrorTypes.NotFound, 'User not found.'));
        }

        // Check user credit amount
        if (userDb.tokenCredit <= 0) {
            return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'cretid tokens not sufficient.'));
        }
        next();
    }
};