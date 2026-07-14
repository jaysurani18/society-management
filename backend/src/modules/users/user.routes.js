import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();
const userController = new UserController();

router.get('/me', authenticateJWT, userController.getProfile);
router.put('/me', authenticateJWT, userController.updateProfile);

export default router;
