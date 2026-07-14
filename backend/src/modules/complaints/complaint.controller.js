import { ComplaintService } from './complaint.service.js';
import { createComplaintSchema, addCommentSchema } from './complaint.validation.js';
import { BadRequestError } from '../../utils/customErrors.js';

export class ComplaintController {
  constructor() {
    this.complaintService = new ComplaintService();
  }

  /**
   * Handle user complaint creation with attachment
   */
  create = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new BadRequestError('Complaint image attachment is required');
      }

      const validatedInput = createComplaintSchema.parse(req.body);
      const actorId = req.user?.id;

      const ticket = await this.complaintService.createComplaint(
        validatedInput,
        req.file.buffer,
        actorId,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: {
          complaint: ticket,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all complaints matching user permission bounds
   */
  getAll = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const result = await this.complaintService.getComplaints(
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

  /**
   * Route/Assign ticket to a committee member
   */
  assign = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { assignedToId } = req.body;
      const actorId = req.user?.id;

      if (!assignedToId) {
        throw new BadRequestError('assignedToId is required in request body');
      }

      const ticket = await this.complaintService.assignComplaint(
        id,
        assignedToId,
        actorId,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        data: {
          complaint: ticket,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resolve complaint ticket
   */
  resolve = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const ticket = await this.complaintService.resolveComplaint(
        id,
        actorId,
        actorRole,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        data: {
          complaint: ticket,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post new comment to complaint thread
   */
  addComment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = addCommentSchema.parse(req.body);
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const comment = await this.complaintService.addComment(
        id,
        validatedInput,
        actorId,
        actorRole,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: {
          comment,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
