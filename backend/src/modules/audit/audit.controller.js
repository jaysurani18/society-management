import { AuditService } from './audit.service.js';

export class AuditController {
  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Handle admin requests to query audit trails
   */
  getLogs = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const { action, userId } = req.query;

      const result = await this.auditService.getLogs({
        page,
        limit,
        action,
        userId,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
