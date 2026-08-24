import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { updateUserCredits } from '../controllers/admin.controller';

// Enable parameters inheritence from the main route define in index.routes.ts
// Otherwise parameter id would't reach the sub-route
const router = Router({ mergeParams: true }); 

// Route to update user credits (admin only)
router.patch('', authenticateToken, authorizeAdmin, updateUserCredits);

export default router;