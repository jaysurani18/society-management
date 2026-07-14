import prisma from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/customErrors.js';

export class PaymentService {
  /**
   * Record a manual cash payment and reconcile in transaction
   */
  async recordCashPayment(billId, input, actorId, ipAddress) {
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Fetch targeted bill using a row-level check
      const bill = await tx.maintenanceBill.findUnique({
        where: { id: billId },
      });

      if (!bill) {
        throw new NotFoundError('Maintenance bill not found');
      }

      // Verify status is explicitly 'UNPAID'
      if (bill.status !== 'UNPAID') {
        throw new BadRequestError('Double-collection error: This maintenance bill has already been paid');
      }

      // 2. Validate amount maths: amountPaid must match amount + penalty - discount
      const expectedAmount = bill.amount + bill.penalty - input.discount;
      
      // Floating point safe compare (approximate equality threshold)
      if (Math.abs(input.amountPaid - expectedAmount) > 0.01) {
        throw new BadRequestError(
          `Amount paid (${input.amountPaid}) does not match calculated total invoice expected (${expectedAmount.toFixed(2)} = base: ${bill.amount} + penalty: ${bill.penalty} - discount: ${input.discount})`
        );
      }

      // 3. Update MaintenanceBill status to 'PAID' and save the discount given
      await tx.maintenanceBill.update({
        where: { id: billId },
        data: {
          status: 'PAID',
          discount: input.discount,
        },
      });

      // 4. Auto-generate a unique receiptNumber serial string
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const receiptNumber = `REC-${Date.now()}-${suffix}`;

      // 5. Create the new PaymentRecord tuple
      const paymentRecord = await tx.paymentRecord.create({
        data: {
          billId,
          amountPaid: input.amountPaid,
          paymentMethod: 'CASH',
          transactionId: receiptNumber, // Set transactionId to receiptNumber for CASH
          receiptNumber,
          paidByName: input.paidByName,
          collectedById: actorId,
        },
        include: {
          bill: {
            include: {
              flat: true,
            },
          },
          collectedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // 6. Append highly detailed tracking event to the AuditLog table
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'PAYMENT_RECORD_CASH',
          details: JSON.stringify({
            billId,
            paymentRecordId: paymentRecord.id,
            receiptNumber,
            amountCollected: input.amountPaid,
            discountApplied: input.discount,
            payee: input.paidByName,
            collectorId: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return paymentRecord;
    });

    return payment;
  }

  /**
   * Get payments history register (Multi-tenant check)
   */
  async getPaymentsHistory(params, actorId, actorRole) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    // Multi-tenant check:
    // Residents only see payments tied to their specific flat
    if (actorRole === 'RESIDENT') {
      const profile = await prisma.residentProfile.findUnique({
        where: { userId: actorId },
      });

      if (!profile) {
        throw new ForbiddenError('No resident profile associated with this account');
      }

      where.bill = {
        flatId: profile.flatId,
      };
    }

    const [payments, total] = await prisma.$transaction([
      prisma.paymentRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          bill: {
            include: {
              flat: true,
            },
          },
          collectedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
      }),
      prisma.paymentRecord.count({ where }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
