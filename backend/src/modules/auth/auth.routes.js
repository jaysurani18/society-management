import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.patch('/change-password', authenticateJWT, authController.changePassword);
router.put('/change-password', authenticateJWT, authController.changePassword);
router.get('/me', authenticateJWT, authController.getMe);

export default router;
