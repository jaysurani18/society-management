import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import flatRoutes from '../modules/flats/flat.routes.js';
import residentRoutes from '../modules/residents/resident.routes.js';
import committeeRoutes from '../modules/committee/committee.routes.js';
import complaintRoutes from '../modules/complaints/complaint.routes.js';
import serviceRequestRoutes from '../modules/service-requests/serviceRequest.routes.js';
import billRoutes from '../modules/bills/bill.routes.js';
import paymentRoutes from '../modules/payments/payment.routes.js';
import announcementRoutes from '../modules/announcements/announcement.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import reportRoutes from '../modules/reports/reports.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/flats', flatRoutes);
router.use('/residents', residentRoutes);
router.use('/committee', committeeRoutes);
router.use('/complaints', complaintRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/bills', billRoutes);
router.use('/payments', paymentRoutes);
router.use('/announcements', announcementRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);

// Mount paymentRoutes at base root of v1 router to support custom routes like '/bills/:id/record-cash'
router.use('/', paymentRoutes);

export default router;
