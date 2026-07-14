import { Router } from 'express';
import { ComplaintController } from './complaint.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';

const router = Router();
const complaintController = new ComplaintController();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('RESIDENT'),
  upload.single('image'),
  complaintController.create
);

router.get(
  '/',
  authenticateJWT, // Open to all authenticated users; filtered in service layer
  complaintController.getAll
);

router.patch(
  '/:id/assign',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  complaintController.assign
);

router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('ADMIN', 'COMMITTEE'),
  complaintController.resolve
);

router.post(
  '/:id/comments',
  authenticateJWT, // Checked internally inside the controller based on role and assignment/ownership
  complaintController.addComment
);

export default router;
