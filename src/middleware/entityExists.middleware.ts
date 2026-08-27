import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

type FindEntityById = (id: string) => Promise<unknown | null>;

export function entityExistsMiddleware(
    paramName: string,
    findById: FindEntityById,
    entityName: string
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[paramName] as string;
        const entity = await findById(id);

        if (!entity) {
            throw ErrorFactory.createError(ErrorTypes.NotFound, `${entityName} not found`);
        }

        next();
    };
}