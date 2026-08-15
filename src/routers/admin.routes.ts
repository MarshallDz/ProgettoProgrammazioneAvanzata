import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { getAllUsers, updateUserCredits } from '../controllers/admin.controller';

const router = Router();

// Route to get all users (admin only)
router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);

// Route to update user credits (admin only)
router.put('/users/:id/credits', authenticateToken, authorizeAdmin, updateUserCredits);

export default router;