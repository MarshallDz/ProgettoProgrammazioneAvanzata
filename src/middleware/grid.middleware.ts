import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { entityExistsMiddleware } from './entityExists.middleware';

export function checkGridExists(gridRepo: IGridRepository) {
    return entityExistsMiddleware('modelId', (id) => gridRepo.getGridById(id), 'Grid');
}