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

router.get(
  '/:id',
  authenticateJWT, // Verified inside the controller
  serviceRequestController.getById
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

router.post(
  '/:id/comments',
  authenticateJWT, // Checked internally inside the controller
  serviceRequestController.addComment
);

export default router;
