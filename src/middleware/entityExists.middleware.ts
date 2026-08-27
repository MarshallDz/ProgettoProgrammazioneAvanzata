import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

type FindEntityById = (id: string) => Promise<unknown | null>;

/**
 * Creates middleware that verifies whether an entity exists by an URL parameter.
 *
 * @param paramName - Name of the request path parameter containing the id.
 * @param findById - Repository lookup function used to find the entity.
 * @param entityName - Entity name used in the not-found error message.
 * @returns Middleware that calls `next` when the entity exists.
 */
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