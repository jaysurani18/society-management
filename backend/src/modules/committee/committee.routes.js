import { Router } from 'express';
import { CommitteeController } from './committee.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const committeeController = new CommitteeController();

router.get(
  '/',
  authenticateJWT, // Any authenticated user can view committee members
  committeeController.getAllActive
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  committeeController.promote
);

router.patch(
  '/:id',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  committeeController.update
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  committeeController.downgrade
);

export default router;
