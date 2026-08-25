import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IUpdateRequestRepository } from '../interfaces/repositories/IUpdateRequestRepository';

// Middleware to check if update request exist before processing the request
export function checkUpdateRequestExists(updateRequestRepo: IUpdateRequestRepository) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params["id"] as string;
        const updateRequest = await updateRequestRepo.getUpdateRequestById(id);
        if (!updateRequest) {
            throw ErrorFactory.createError(ErrorTypes.NotFound, "Update request not found");
        }
        next();
    }
};