import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';

// Middleware to check if grid exist before processing the request
export function checkGridExists(gridRepo: IGridRepository) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params["modelId"] as string;
        const grid = await gridRepo.getGridById(id);
        if (!grid) {
            throw ErrorFactory.createError(ErrorTypes.NotFound, "Grid not found");
        }
        next();
    }
};