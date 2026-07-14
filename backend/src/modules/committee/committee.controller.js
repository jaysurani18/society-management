import { CommitteeService } from './committee.service.js';
import { promoteCommitteeSchema, updateCommitteeSchema } from './committee.validation.js';

export class CommitteeController {
  constructor() {
    this.committeeService = new CommitteeService();
  }

  /**
   * Upgrade standard user to committee member (Admin only)
   */
  promote = async (req, res, next) => {
    try {
      const validatedInput = promoteCommitteeSchema.parse(req.body);
      const actorId = req.user?.id;

      const profile = await this.committeeService.promoteToCommittee(validatedInput, actorId, req.ip);

      res.status(201).json({
        status: 'success',
        data: {
          committee: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update committee member's designation/responsibilities (Admin only)
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = updateCommitteeSchema.parse(req.body);
      const actorId = req.user?.id;

      const updated = await this.committeeService.updateCommittee(id, validatedInput, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        data: {
          committee: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Downgrade committee member back to standard resident (Admin only)
   */
  downgrade = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;

      const result = await this.committeeService.downgradeCommittee(id, actorId, req.ip);

      res.status(200).json({
        status: 'success',
        message: 'Committee member successfully downgraded back to standard resident',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all active committee members (Any authenticated user)
   */
  getAllActive = async (req, res, next) => {
    try {
      const members = await this.committeeService.getAllActiveCommittee();

      res.status(200).json({
        status: 'success',
        results: members.length,
        data: {
          committee: members,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
