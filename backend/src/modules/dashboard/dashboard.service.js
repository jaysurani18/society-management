import prisma from '../../config/prisma.js';
import { ForbiddenError } from '../../utils/customErrors.js';

export class DashboardService {
  /**
   * Aggregate statistics for ADMIN role
   */
  async getAdminSummary() {
    const [
      activeResidentsCount,
      unpaidBillsCount,
      revenuePaidAgg,
      totalBillsCount,
      paidBillsCount,
      pendingComplaintsCount,
      recentPayments,
    ] = await Promise.all([
      // Total active residents
      prisma.user.count({
        where: { role: 'RESIDENT', isActive: true },
      }),
      // Total outstanding unpaid bills
      prisma.maintenanceBill.count({
        where: { status: 'UNPAID' },
      }),
      // Revenue overview (sum of paid amounts)
      prisma.paymentRecord.aggregate({
        _sum: {
          amountPaid: true,
        },
      }),
      // Total bills count (for rate calculation)
      prisma.maintenanceBill.count(),
      // Paid bills count (for rate calculation)
      prisma.maintenanceBill.count({
        where: { status: 'PAID' },
      }),
      // Counts of unresolved complaints (PENDING or ASSIGNED)
      prisma.complaint.count({
        where: { status: { not: 'RESOLVED' } },
      }),
      // Recent payments (last 5 records)
      prisma.paymentRecord.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          bill: {
            include: {
              flat: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = revenuePaidAgg._sum.amountPaid || 0;
    const collectionRate = totalBillsCount > 0 
      ? (paidBillsCount / totalBillsCount) * 100 
      : 0;

    return {
      activeResidents: activeResidentsCount,
      unpaidBillsCount,
      totalRevenueCollected: totalRevenue,
      maintenanceCollectionRate: parseFloat(collectionRate.toFixed(2)),
      pendingComplaints: pendingComplaintsCount,
      recentPayments,
    };
  }

  /**
   * Aggregate statistics for COMMITTEE role
   */
  async getCommitteeSummary(actorId) {
    const [
      totalPendingComplaints,
      myAssignedComplaints,
      pendingServiceRequests,
      recentAnnouncements,
    ] = await Promise.all([
      // Total unresolved complaints
      prisma.complaint.count({
        where: { status: { not: 'RESOLVED' } },
      }),
      // Complaints assigned directly to this user and not yet resolved
      prisma.complaint.count({
        where: {
          assignedToId: actorId,
          status: { not: 'RESOLVED' },
        },
      }),
      // Pending service requests
      prisma.serviceRequest.count({
        where: { status: 'PENDING' },
      }),
      // Recent community announcements (last 5 records)
      prisma.announcement.findMany({
        take: 5,
        orderBy: [
          { scheduledFor: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      totalPendingComplaints,
      assignedComplaintsToMe: myAssignedComplaints,
      pendingServiceRequests,
      recentAnnouncements,
    };
  }

  /**
   * Aggregate statistics for RESIDENT role
   */
  async getResidentSummary(actorId) {
    const profile = await prisma.residentProfile.findUnique({
      where: { userId: actorId },
    });

    if (!profile) {
      throw new ForbiddenError('No resident profile associated with this account');
    }

    const [
      unpaidBills,
      myComplaints,
      myRequests,
      recentAnnouncements,
    ] = await Promise.all([
      // Outstanding bills for their specific flat
      prisma.maintenanceBill.findMany({
        where: {
          flatId: profile.flatId,
          status: 'UNPAID',
        },
      }),
      // Complaints raised by the resident
      prisma.complaint.findMany({
        where: { raisedById: actorId },
        select: { status: true },
      }),
      // Service requests raised by the resident
      prisma.serviceRequest.findMany({
        where: { raisedById: actorId },
        select: { status: true },
      }),
      // Recent community announcements (last 5 records)
      prisma.announcement.findMany({
        take: 5,
        orderBy: [
          { scheduledFor: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    // Calculate total outstanding balance
    const outstandingBalance = unpaidBills.reduce(
      (sum, bill) => sum + bill.amount + bill.penalty - bill.discount, 
      0
    );

    // Summarize complaints status
    const complaintsSummary = myComplaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    // Summarize service requests status
    const requestsSummary = myRequests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    return {
      outstandingBalance: parseFloat(outstandingBalance.toFixed(2)),
      unpaidBillsCount: unpaidBills.length,
      complaintsCount: complaintsSummary,
      serviceRequestsCount: requestsSummary,
      recentAnnouncements,
    };
  }
}
