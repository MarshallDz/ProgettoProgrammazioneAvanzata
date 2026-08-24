import Router from 'express';
import { UpdateRequestRepository } from '../repositories/UpdateRequestRepository';
import { GridRepository } from '../repositories/GridRepository';
import { UpdateRequestController } from '../controllers/updateRequest.controller';

const router = Router();

const updateRequestRepository = new UpdateRequestRepository();
const gridRepository = new GridRepository();
const updateRequestController = new UpdateRequestController(updateRequestRepository, gridRepository);

router.patch("/:id", updateRequestController.updateRequest)
router.patch('/batch', updateRequestController.updateRequestBatch)

export default router;