import Router from 'express';
import { GridController } from '../controllers/grid.controller';
import { UserRepository } from '../repositories/UserRepository';
import { UpdateRequestRepository } from '../repositories/UpdateRequestRepository';
import { GridRepository } from '../repositories/GridRepository';
import { checkGridExists } from '../middleware/grid.middleware';

const router = Router();

const userRepository = new UserRepository();
const gridRepository = new GridRepository();
const updateRequestRepository = new UpdateRequestRepository();
const gridController = new GridController(userRepository, gridRepository, updateRequestRepository);

// Create a Grid
router.post('', gridController.createGrid);
 
// Update a grid
router.patch('/:id', checkGridExists(gridRepository), gridController.updateGrid);

// Run a model
router.post("/:id/run", checkGridExists(gridRepository), gridController.runGrid);

export default router;