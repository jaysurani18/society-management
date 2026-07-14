import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const auditController = new AuditController();

router.get(
  '/',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  auditController.getLogs
);

export default router;
