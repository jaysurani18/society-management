import prisma from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/customErrors.js';

export class ServiceRequestService {
  /**
   * Initialize a new service request (Status starts as 'PENDING')
   */
  async createRequest(input, actorId, ipAddress) {
    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.serviceRequest.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          status: 'PENDING',
          raisedById: actorId,
        },
        include: {
          raisedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'SERVICE_REQUEST_CREATE',
          details: JSON.stringify({
            requestId: created.id,
            category: created.category,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return created;
    });

    return request;
  }

  /**
   * Fetch service requests list (Multi-tenant)
   */
  async getRequests(params, actorId, actorRole) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    // Multi-tenant filter:
    // Residents can only view requests they raised themselves
    if (actorRole === 'RESIDENT') {
      where.raisedById = actorId;
    }

    const [requests, total] = await prisma.$transaction([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          raisedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Review a pending request (Set status to 'APPROVED' or 'REJECTED')
   */
  async reviewRequest(id, status, actorId, ipAddress) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestError('Only pending service requests can be reviewed');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.serviceRequest.update({
        where: { id },
        data: {
          status, // APPROVED or REJECTED
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: `SERVICE_REQUEST_REVIEW_${status}`,
          details: JSON.stringify({
            requestId: id,
            reviewedBy: actorId,
            status,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return req;
    });

    return updated;
  }

  /**
   * Resolve an approved request (Move status to 'COMPLETED')
   */
  async resolveRequest(id, actorId, ipAddress) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Enforce state transition checks: ONLY 'APPROVED' requests can be resolved
    if (request.status !== 'APPROVED') {
      throw new BadRequestError('Only approved service requests can be marked as completed');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'SERVICE_REQUEST_RESOLVE',
          details: JSON.stringify({
            requestId: id,
            resolvedBy: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return req;
    });

    return updated;
  }

  /**
   * Submit resident feedback (Enforces 'COMPLETED' status and ownership check)
   */
  async submitFeedback(id, feedbackText, actorId, ipAddress) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Ownership check: must match req.user.id
    if (request.raisedById !== actorId) {
      throw new ForbiddenError('You can only submit feedback for your own service requests');
    }

    // Status check: must already be 'COMPLETED'
    if (request.status !== 'COMPLETED') {
      throw new BadRequestError('Feedback can only be submitted for completed service requests');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.serviceRequest.update({
        where: { id },
        data: {
          feedback: feedbackText,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'SERVICE_REQUEST_FEEDBACK',
          details: JSON.stringify({
            requestId: id,
            feedbackSubmittedBy: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return req;
    });

    return updated;
  }
}
