import { Router } from 'express';
import { UpdateRequestRepository } from '../repositories/UpdateRequestRepository';
import { GridRepository } from '../repositories/GridRepository';
import { UpdateRequestController } from '../controllers/updateRequest.controller';
import { checkGridExists } from '../middleware/grid.middleware';
import { checkUpdateRequestExists } from '../middleware/updateRequest.middleware';

const router = Router();

const updateRequestRepository = new UpdateRequestRepository();
const gridRepository = new GridRepository();
const updateRequestController = new UpdateRequestController(updateRequestRepository, gridRepository);

// Get the list of update requests with status accepted/rejected relating to a specific grid id, eventually filtered by date 
router.get('/:modelId/updates', checkGridExists(gridRepository), updateRequestController.getRequestsByModelId)

// Get the list of update requests with status pending relating to a specific grid id
router.get('/:modelId/status', checkGridExists(gridRepository), updateRequestController.getPendingRequestsByModelId)

// Get the list of update requests with status pending relating to the current user id
router.get('/pending', updateRequestController.getPendingRequests)

// Accept or rejects a batch of update requests specifing the ids and status
router.patch('/batch', updateRequestController.updateRequestBatch)

// Accept or reject a specific update request
router.patch("/:id", checkUpdateRequestExists(updateRequestRepository), updateRequestController.updateRequest)

// Accept single cells or reject single cells accepting the others
router.patch("/:id/updateCells", checkUpdateRequestExists(updateRequestRepository), updateRequestController.updateRequestByCells)

export default router;