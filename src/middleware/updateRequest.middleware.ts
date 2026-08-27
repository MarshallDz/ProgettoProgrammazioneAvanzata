import { IUpdateRequestRepository } from '../interfaces/repositories/IUpdateRequestRepository';
import { entityExistsMiddleware } from './entityExists.middleware';

/**
 * Creates middleware that checks whether the update request in
 * `req.params.id` exists before the route handler runs.
 *
 * @param updateRequestRepo - Repository used to retrieve the update request.
 * @returns Middleware that forwards the request or raises a not-found error.
 */
export function checkUpdateRequestExists(updateRequestRepo: IUpdateRequestRepository) {
    return entityExistsMiddleware('id', (id) => updateRequestRepo.getUpdateRequestById(id), 'Update request');
}