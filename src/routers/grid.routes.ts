import Router from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createGrid } from '../controllers/grid.controller';

const router = Router();

// Create a Grid
router.post('', authenticateToken, createGrid);

export default router;