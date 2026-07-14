import { BillService } from './bill.service.js';
import { batchGenerateSchema, assignPenaltySchema } from './bill.validation.js';

export class BillController {
  constructor() {
    this.billService = new BillService();
  }

  /**
   * Automate batch invoice creation (Admin only)
   */
  batchGenerate = async (req, res, next) => {
    try {
      const validatedInput = batchGenerateSchema.parse(req.body);
      const actorId = req.user?.id;

      const result = await this.billService.batchGenerate(validatedInput, actorId, req.ip);

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add custom penalty fee to an unpaid bill (Admin only)
   */
  assignPenalty = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = assignPenaltySchema.parse(req.body);
      const actorId = req.user?.id;

      const bill = await this.billService.assignPenalty(id, validatedInput.penaltyAmount, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        data: {
          bill,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch paginated bills ledger (Multi-tenant)
   */
  getAll = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { flatId, billingMonth, status } = req.query;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const result = await this.billService.getBills(
        { page, limit, flatId, billingMonth, status },
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

  /**
   * Fetch single bill details (Ownership verified in service layer)
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const bill = await this.billService.getBillById(id, actorId, actorRole);

      res.status(200).json({
        status: 'success',
        data: {
          bill,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
