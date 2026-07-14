import prisma from '../../config/prisma.js';

export class ReportsService {
  /**
   * Financial performance cross-domain data reports
   */
  async getFinanceReport() {
    const bills = await prisma.maintenanceBill.findMany({
      include: {
        paymentRecord: true,
      },
    });

    const groups = {};

    for (const bill of bills) {
      const month = bill.billingPeriod; // format: "YYYY-MM"
      
      if (!groups[month]) {
        groups[month] = {
          billingMonth: month,
          totalInvoiced: 0,
          totalCollected: 0,
          totalPenalties: 0,
          outstandingArrears: 0,
        };
      }

      const invoiceAmount = bill.amount + bill.penalty;
      groups[month].totalInvoiced += invoiceAmount;
      groups[month].totalPenalties += bill.penalty;

      if (bill.status === 'PAID') {
        const collected = bill.paymentRecord 
          ? bill.paymentRecord.amountPaid 
          : (bill.amount + bill.penalty - bill.discount);
        groups[month].totalCollected += collected;
      } else {
        const arrears = bill.amount + bill.penalty - bill.discount;
        groups[month].outstandingArrears += arrears;
      }
    }

    // Format fields as precise decimal numbers and sort by month descending
    const reportData = Object.values(groups).map((g) => ({
      billingMonth: g.billingMonth,
      totalInvoiced: parseFloat(g.totalInvoiced.toFixed(2)),
      totalCollected: parseFloat(g.totalCollected.toFixed(2)),
      totalPenalties: parseFloat(g.totalPenalties.toFixed(2)),
      outstandingArrears: parseFloat(g.outstandingArrears.toFixed(2)),
    })).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));

    return reportData;
  }

  /**
   * Operations throughput report (Complaints lifecycle speeds and breakdowns)
   */
  async getOperationsReport() {
    const [
      totalComplaintsCount,
      resolvedComplaints,
      openComplaints,
    ] = await Promise.all([
      // Total complaints raised
      prisma.complaint.count(),
      // Resolved complaints for speed calculation
      prisma.complaint.findMany({
        where: { status: 'RESOLVED' },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Open complaints (non-resolved) for category breakdowns
      prisma.complaint.findMany({
        where: {
          status: {
            not: 'RESOLVED',
          },
        },
        select: {
          category: true,
        },
      }),
    ]);

    // Calculate resolution duration speeds in hours
    let averageResolutionTimeHours = 0;
    if (resolvedComplaints.length > 0) {
      const sumDurationMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (c.updatedAt.getTime() - c.createdAt.getTime());
      }, 0);
      const avgDurationMs = sumDurationMs / resolvedComplaints.length;
      averageResolutionTimeHours = parseFloat((avgDurationMs / (1000 * 60 * 60)).toFixed(2));
    }

    // Category breakdown counts
    const categoryBreakdown = openComplaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalComplaintsRaised: totalComplaintsCount,
      totalResolved: resolvedComplaints.length,
      averageResolutionSpeedHours: averageResolutionTimeHours,
      openComplaintsBreakdown: categoryBreakdown,
    };
  }
}
