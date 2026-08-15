import {Router} from 'express';
import { Request, Response } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { getAllUsers, updateUserCredits } from '../controllers/admin.controller';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import authRoutes from './auth.routes';
import provaRoutes from './prova.routes';

const router = Router();

// Health route
router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'UP' });
});

router.use('/auth', authRoutes);
router.use('/', provaRoutes);

// Route to get all users (admin only)
router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);

// Route to update user credits (admin only)
router.put('/users/:id/credits', authenticateToken, authorizeAdmin, updateUserCredits);
// Middleware to handle 404 errors for undefined routes
router.use((req, res, next) => {
    next(ErrorFactory.createError(ErrorTypes.NotFound, 'Rotta non trovata'));
});


export default router;