import { Router } from 'express';
import { BillController } from './bill.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const billController = new BillController();

router.post(
  '/batch-generate',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  billController.batchGenerate
);

router.post(
  '/:id/penalty',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  billController.assignPenalty
);

router.get(
  '/',
  authenticateJWT, // Multi-tenant locks handled inside service layer
  billController.getAll
);

router.get(
  '/:id',
  authenticateJWT, // Ownership checks verified inside service layer
  billController.getById
);

router.get(
  '/:id/receipt',
  authenticateJWT, // Ownership checks verified inside service layer
  billController.getReceipt
);

export default router;
