import prisma from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/customErrors.js';

export class BillService {
  /**
   * Batch generate maintenance invoices for all active flats
   */
  async batchGenerate(input, actorId, ipAddress) {
    const flats = await prisma.flat.findMany();
    if (flats.length === 0) {
      throw new BadRequestError('No flats exist in the system to generate bills for');
    }

    const dueDate = new Date(input.dueDate);
    const createdBillIds = [];
    let skippedCount = 0;

    // Use a transaction to ensure atomic execution of the batch
    await prisma.$transaction(async (tx) => {
      for (const flat of flats) {
        // Enforce duplicate prevention check
        const existing = await tx.maintenanceBill.findUnique({
          where: {
            flatId_billingPeriod: {
              flatId: flat.id,
              billingPeriod: input.billingMonth,
            },
          },
        });

        if (existing) {
          throw new BadRequestError(`Billing invoice already generated for flat ${flat.number} in period ${input.billingMonth}`);
        }

        const bill = await tx.maintenanceBill.create({
          data: {
            flatId: flat.id,
            amount: input.amount,
            dueDate,
            billingPeriod: input.billingMonth,
            status: 'UNPAID',
            penalty: 0,
            discount: 0,
          },
        });

        createdBillIds.push(bill.id);
      }

      // Only write to audit logs if bills were created
      if (createdBillIds.length > 0) {
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'BILL_BATCH_GENERATE',
            details: JSON.stringify({
              billingMonth: input.billingMonth,
              amount: input.amount,
              createdCount: createdBillIds.length,
              skippedCount,
            }),
            ipAddress: ipAddress || null,
          },
        });
      }
    });

    return {
      totalFlats: flats.length,
      createdCount: createdBillIds.length,
      skippedCount,
    };
  }

  /**
   * Append late penalty fee to specific bill
   */
  async assignPenalty(id, penaltyAmount, actorId, ipAddress) {
    const bill = await prisma.maintenanceBill.findUnique({
      where: { id },
    });

    if (!bill) {
      throw new NotFoundError('Maintenance bill not found');
    }

    if (bill.status !== 'UNPAID') {
      throw new BadRequestError('Late penalty fees can only be added to unpaid bills');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.maintenanceBill.update({
        where: { id },
        data: {
          penalty: bill.penalty + penaltyAmount,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'BILL_ASSIGN_PENALTY',
          details: JSON.stringify({
            billId: id,
            penaltyAdded: penaltyAmount,
            totalPenalty: b.penalty,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return b;
    });

    return updated;
  }

  /**
   * Fetch paginated bills ledger (Multi-tenant)
   */
  async getBills(params, actorId, actorRole) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    // Multi-tenant check:
    // Residents are strictly locked down to bills belonging to their specific flat
    if (actorRole === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({
        where: { userId: actorId },
      });

      if (!profile) {
        throw new ForbiddenError('No resident profile associated with this account');
      }

      where.flatId = profile.flatId;
    } else {
      // Admins/Committee members can filter by flatId, billingMonth (billingPeriod), and status
      if (params.flatId) {
        where.flatId = params.flatId;
      }
      if (params.billingMonth) {
        where.billingPeriod = params.billingMonth;
      }
      if (params.status) {
        where.status = params.status;
      }
    }

    const [bills, total] = await prisma.$transaction([
      prisma.maintenanceBill.findMany({
        where,
        skip,
        take: limit,
        include: {
          flat: true,
          paymentRecord: true,
        },
        orderBy: {
          billingPeriod: 'desc',
        },
      }),
      prisma.maintenanceBill.count({ where }),
    ]);

    return {
      bills,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetch single bill (with resident ownership verification)
   */
  async getBillById(id, actorId, actorRole) {
    const bill = await prisma.maintenanceBill.findUnique({
      where: { id },
      include: {
        flat: true,
        paymentRecord: true,
      },
    });

    if (!bill) {
      throw new NotFoundError('Maintenance bill not found');
    }

    // Resident ownership verification
    if (actorRole === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({
        where: { userId: actorId },
      });

      if (!profile || profile.flatId !== bill.flatId) {
        throw new ForbiddenError('You do not have access to view this bill');
      }
    }

    return bill;
  }

  /**
   * Fetch payment receipt details associated with a bill
   */
  async getBillReceipt(id, actorId, actorRole) {
    const bill = await prisma.maintenanceBill.findUnique({
      where: { id },
      include: {
        flat: true,
        paymentRecord: {
          include: {
            collectedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      throw new NotFoundError('Maintenance bill not found');
    }

    // Resident ownership verification
    if (actorRole === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({
        where: { userId: actorId },
      });

      if (!profile || profile.flatId !== bill.flatId) {
        throw new ForbiddenError('You do not have access to view this receipt');
      }
    }

    if (!bill.paymentRecord) {
      throw new BadRequestError('No payment record or receipt exists for this bill');
    }

    return bill.paymentRecord;
  }
}
