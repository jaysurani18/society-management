import { Router } from 'express';
import { ResidentController } from './resident.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const residentController = new ResidentController();

router.get(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  residentController.getAll
);

router.get(
  '/:id',
  authenticateJWT, // Checks user's own identity internally in the controller if not Admin/Committee
  residentController.getById
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  residentController.onboard
);

router.put(
  '/:id',
  authenticateJWT, // Checks user's own identity internally in the controller if not Admin
  residentController.update
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  residentController.delete
);

export default router;
