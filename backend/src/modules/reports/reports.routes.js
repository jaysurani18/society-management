import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const reportsController = new ReportsController();

router.get(
  '/finance',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  reportsController.getFinance
);

router.get(
  '/operations',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  reportsController.getOperations
);

export default router;
