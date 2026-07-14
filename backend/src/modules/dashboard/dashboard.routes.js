import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();
const dashboardController = new DashboardController();

router.get(
  '/summary',
  authenticateJWT,
  dashboardController.getSummary
);

export default router;
