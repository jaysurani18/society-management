import { ReportsService } from './reports.service.js';

export class ReportsController {
  constructor() {
    this.reportsService = new ReportsService();
  }

  /**
   * Fetch financial performance data report (Admin only)
   */
  getFinance = async (req, res, next) => {
    try {
      const data = await this.reportsService.getFinanceReport();

      res.status(200).json({
        status: 'success',
        data: {
          report: data,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch operational tickets throughput report (Admin/Committee only)
   */
  getOperations = async (req, res, next) => {
    try {
      const data = await this.reportsService.getOperationsReport();

      res.status(200).json({
        status: 'success',
        data: {
          report: data,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
