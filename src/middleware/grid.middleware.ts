import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { entityExistsMiddleware } from './entityExists.middleware';

/**
 * Creates middleware that checks whether the grid in `req.params.modelId`
 * exists before the route handler runs.
 *
 * @param gridRepo - Grid repository used to retrieve the grid by id.
 * @returns Middleware that forwards the request or raises a not-found error.
 */
export function checkGridExists(gridRepo: IGridRepository) {
    return entityExistsMiddleware('modelId', (id) => gridRepo.getGridById(id), 'Grid');
}