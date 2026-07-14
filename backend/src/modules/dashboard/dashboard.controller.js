import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Fetch statistical aggregates dynamically based on user role
   */
  getSummary = async (req, res, next) => {
    try {
      const { role, id: actorId } = req.user;
      let summaryData;

      if (role === 'ADMIN') {
        summaryData = await this.dashboardService.getAdminSummary();
      } else if (role === 'COMMITTEE') {
        summaryData = await this.dashboardService.getCommitteeSummary(actorId);
      } else {
        // RESIDENT role
        summaryData = await this.dashboardService.getResidentSummary(actorId);
      }

      res.status(200).json({
        status: 'success',
        role,
        data: summaryData,
      });
    } catch (error) {
      next(error);
    }
  };
}
