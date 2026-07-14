import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const paymentController = new PaymentController();

// POST /api/v1/bills/:id/record-cash
router.post(
  '/bills/:id/record-cash',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  paymentController.recordCash
);

// GET /api/v1/payments/history
router.get(
  '/payments/history',
  authenticateJWT, // Multi-tenant locks handled inside service layer
  paymentController.getHistory
);

export default router;
