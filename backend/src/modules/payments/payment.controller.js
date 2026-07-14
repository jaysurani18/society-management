import { PaymentService } from './payment.service.js';
import { recordCashPaymentSchema } from './payment.validation.js';

export class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Record a manual cash collection against a bill (Admin/Committee)
   */
  recordCash = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = recordCashPaymentSchema.parse(req.body);
      const actorId = req.user?.id;

      const payment = await this.paymentService.recordCashPayment(
        id,
        validatedInput,
        actorId,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: {
          payment,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch cash payment history ledgers (Multi-tenant)
   */
  getHistory = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const result = await this.paymentService.getPaymentsHistory(
        { page, limit },
        actorId,
        actorRole
      );

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
