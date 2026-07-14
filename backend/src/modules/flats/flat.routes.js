import { Router } from 'express';
import { FlatController } from './flat.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const flatController = new FlatController();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  flatController.create
);

router.get(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  flatController.getAll
);

export default router;
