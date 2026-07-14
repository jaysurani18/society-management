import { Router } from 'express';
import { AnnouncementController } from './announcement.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const announcementController = new AnnouncementController();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  announcementController.create
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  announcementController.update
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  announcementController.delete
);

router.get(
  '/',
  authenticateJWT, // Any authenticated user can view notices
  announcementController.getAll
);

export default router;
