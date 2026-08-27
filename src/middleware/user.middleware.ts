import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { entityExistsMiddleware } from './entityExists.middleware';

export function checkUserExists(userRepo: IUserRepository) {
    return entityExistsMiddleware('id', (id) => userRepo.getUserById(id), 'User');
}

// Middleware to check if user have a credit amount over zero
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