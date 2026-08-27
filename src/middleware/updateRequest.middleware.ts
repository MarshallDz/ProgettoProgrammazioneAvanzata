import { IUpdateRequestRepository } from '../interfaces/repositories/IUpdateRequestRepository';
import { entityExistsMiddleware } from './entityExists.middleware';

export function checkUpdateRequestExists(updateRequestRepo: IUpdateRequestRepository) {
    return entityExistsMiddleware('id', (id) => updateRequestRepo.getUpdateRequestById(id), 'Update request');
}