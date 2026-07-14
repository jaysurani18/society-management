import cloudinary from '../../config/cloudinary.js';
import prisma from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/customErrors.js';

/**
 * Stream file buffer to Cloudinary using a Promise wrapper
 */
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'society_management/complaints' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export class ComplaintService {
  /**
   * Create a new complaint ticket with image upload
   */
  async createComplaint(input, fileBuffer, actorId, ipAddress) {
    if (!fileBuffer) {
      throw new BadRequestError('Complaint image attachment is required');
    }

    // Stream upload file to Cloudinary
    let imageUrl;
    try {
      imageUrl = await uploadToCloudinary(fileBuffer);
    } catch (err) {
      throw new BadRequestError(`Failed to upload attachment: ${err.message}`);
    }

    const complaint = await prisma.$transaction(async (tx) => {
      const ticket = await tx.complaint.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          imageUrl,
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
          action: 'COMPLAINT_CREATE',
          details: JSON.stringify({
            complaintId: ticket.id,
            title: ticket.title,
            imageUrl: ticket.imageUrl,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return ticket;
    });

    return complaint;
  }

  /**
   * Fetch complaints list (Multi-tenant)
   */
  async getComplaints(params, actorId, actorRole) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    // Multi-tenant routing rules:
    // Residents only see tickets they raised themselves
    if (actorRole === 'RESIDENT') {
      where.raisedById = actorId;
    }

    const [complaints, total] = await prisma.$transaction([
      prisma.complaint.findMany({
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
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      complaints,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Route/Assign complaint to a specific committee member (Admin only)
   */
  async assignComplaint(id, assignedToId, actorId, ipAddress) {
    const ticket = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundError('Complaint not found');
    }

    // Verify assignment target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!targetUser) {
      throw new NotFoundError('Assignee user not found');
    }

    if (targetUser.role !== 'COMMITTEE' && targetUser.role !== 'ADMIN') {
      throw new BadRequestError('Tickets can only be assigned to Admin or Committee members');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          assignedToId,
        },
        include: {
          assignedTo: {
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
          action: 'COMPLAINT_ASSIGN',
          details: JSON.stringify({
            complaintId: id,
            assignedToId,
            assignedBy: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return comp;
    });

    return updated;
  }

  /**
   * Advance ticket status to RESOLVED
   */
  async resolveComplaint(id, actorId, actorRole, ipAddress) {
    const ticket = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundError('Complaint not found');
    }

    // Committee members can only resolve complaints assigned to their specific ID
    if (actorRole === 'COMMITTEE' && ticket.assignedToId !== actorId) {
      throw new ForbiddenError('You can only resolve complaints assigned directly to you');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id },
        data: {
          status: 'RESOLVED',
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'COMPLAINT_RESOLVE',
          details: JSON.stringify({
            complaintId: id,
            resolvedBy: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return comp;
    });

    return updated;
  }

  /**
   * Append a new comment to a ticket thread
   */
  async addComment(id, input, actorId, actorRole, ipAddress) {
    const ticket = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundError('Complaint not found');
    }

    // Role-based thread verification:
    // Residents can only comment on their own tickets
    if (actorRole === 'RESIDENT' && ticket.raisedById !== actorId) {
      throw new ForbiddenError('You can only comment on your own complaints');
    }

    // Committee members can only comment on tickets routed to them
    if (actorRole === 'COMMITTEE' && ticket.assignedToId !== actorId) {
      throw new ForbiddenError('You can only comment on complaints assigned directly to you');
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.complaintComment.create({
        data: {
          complaintId: id,
          authorId: actorId,
          comment: input.comment,
        },
        include: {
          author: {
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

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'COMPLAINT_COMMENT_ADD',
          details: JSON.stringify({
            complaintId: id,
            commentId: newComment.id,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return newComment;
    });

    return comment;
  }
}
