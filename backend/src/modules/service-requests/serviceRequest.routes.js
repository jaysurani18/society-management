import { Router } from 'express';
import { ServiceRequestController } from './serviceRequest.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';

const router = Router();
const serviceRequestController = new ServiceRequestController();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('RESIDENT'),
  serviceRequestController.create
);

router.get(
  '/',
  authenticateJWT, // Multi-tenant logic handled inside getRequests in the service layer
  serviceRequestController.getAll
);

router.patch(
  '/:id/review',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  serviceRequestController.review
);

router.patch(
  '/:id/resolve',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  serviceRequestController.resolve
);

router.patch(
  '/:id/feedback',
  authenticateJWT,
  authorizeRoles('RESIDENT'),
  serviceRequestController.submitFeedback
);

export default router;
