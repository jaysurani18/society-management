import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const userController = new UserController();

router.get('/me', authenticateJWT, userController.getProfile);
router.put('/me', authenticateJWT, userController.updateProfile);
router.post(
  '/:id/reset-password',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  userController.adminResetPassword
);

export default router;
