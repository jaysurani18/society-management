import { ServiceRequestService } from './serviceRequest.service.js';
import {
  createServiceRequestSchema,
  reviewServiceRequestSchema,
  feedbackServiceRequestSchema,
} from './serviceRequest.validation.js';

export class ServiceRequestController {
  constructor() {
    this.serviceRequestService = new ServiceRequestService();
  }

  /**
   * Handle user service request creation
   */
  create = async (req, res, next) => {
    try {
      const validatedInput = createServiceRequestSchema.parse(req.body);
      const actorId = req.user?.id;

      const request = await this.serviceRequestService.createRequest(
        validatedInput,
        actorId,
        req.ip
      );

      res.status(201).json({
        status: 'success',
        data: {
          serviceRequest: request,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all service requests matching user role restrictions
   */
  getAll = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const result = await this.serviceRequestService.getRequests(
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
   * Review pending request (APPROVE/REJECT)
   */
  review = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = reviewServiceRequestSchema.parse(req.body);
      const actorId = req.user?.id;

      const request = await this.serviceRequestService.reviewRequest(
        id,
        validatedInput.status,
        actorId,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        data: {
          serviceRequest: request,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark approved request as completed
   */
  resolve = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;

      const request = await this.serviceRequestService.resolveRequest(
        id,
        actorId,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        data: {
          serviceRequest: request,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit resident feedback for completed request
   */
  submitFeedback = async (req, res, next) => {
    try {
      const { id } = req.params;
      const validatedInput = feedbackServiceRequestSchema.parse(req.body);
      const actorId = req.user?.id;

      const request = await this.serviceRequestService.submitFeedback(
        id,
        validatedInput.feedback,
        actorId,
        req.ip
      );

      res.status(200).json({
        status: 'success',
        data: {
          serviceRequest: request,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch single service request by ID
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const request = await this.serviceRequestService.getRequestById(id, actorId, actorRole);

      res.status(200).json({
        status: 'success',
        data: {
          serviceRequest: request,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post comment to service request timeline
   */
  addComment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const commentText = req.body.content || req.body.comment || '';
      if (!commentText.trim()) {
        return res.status(400).json({
          status: 'fail',
          message: 'Comment content is required',
        });
      }

      const actorId = req.user?.id;
      const actorRole = req.user?.role;

      const comment = await this.serviceRequestService.addComment(
        id,
        commentText.trim(),
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
