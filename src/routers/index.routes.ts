import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { checkUserExists, checkUserCredit } from '../middleware/user.middleware';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import authRoutes from './auth.routes';
import gridRoutes from './grid.routes';
import adminRoutes from './admin.routes';
import updateRequestRoutes from './updateRequest.routes';
import { UserRepository } from '../repositories/UserRepository';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';

const router = Router();

const userRepository = new UserRepository();

// Health route
router.get('/health', (_req: Request, res: Response) => {
    SuccessFactory.createSuccess(SuccessTypes.Ok, 'Server Up and Running', {status: 'UP'}).send(res);
});

// Login and register routes
router.use('/auth', authRoutes);

// Routes to manage grids
router.use('/grids', authenticateToken, checkUserCredit(userRepository), gridRoutes);

// Routes to manage update requests
router.use('/updateRequests', authenticateToken, updateRequestRoutes);

// Route to update user credits (admin only)
router.use('/users/:id/credits', authenticateToken, authorizeAdmin, checkUserExists(userRepository), adminRoutes);

// Middleware to handle 404 errors for undefined routes
router.use((req, res, next) => {
    next(ErrorFactory.createError(ErrorTypes.NotFound, 'Rotta non trovata'));
});


export default router;