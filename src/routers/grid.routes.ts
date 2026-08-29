import Router from 'express';
import { GridController } from '../controllers/grid.controller';
import { UserRepository } from '../repositories/UserRepository';
import { UpdateRequestRepository } from '../repositories/UpdateRequestRepository';
import { GridRepository } from '../repositories/GridRepository';
import { checkGridExists } from '../middleware/grid.middleware';
import { validateData } from '../middleware/validation.middleware';
import { gridSchema, gridUpdateSchema, gridExecutionSchema } from '../validation/grid.validation';

const router = Router();

const userRepository = new UserRepository();
const gridRepository = new GridRepository();
const updateRequestRepository = new UpdateRequestRepository();
const gridController = new GridController(userRepository, gridRepository, updateRequestRepository);

// Create a Grid
router.post('', validateData(gridSchema, 'body'), gridController.createGrid);
 
// Update a grid
router.patch('/:modelId', checkGridExists(gridRepository), validateData(gridUpdateSchema, 'body'), gridController.updateGrid);

// Run a model
router.post("/:modelId/run", checkGridExists(gridRepository), validateData(gridExecutionSchema, 'body'), gridController.runGrid);

export default router;