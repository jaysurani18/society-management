import prisma from '../../config/prisma.js';
import { NotFoundError } from '../../utils/customErrors.js';

export class AnnouncementService {
  /**
   * Create a notice announcement
   */
  async createAnnouncement(input, actorId, ipAddress) {
    const scheduledDate = input.scheduledFor ? new Date(input.scheduledFor) : new Date();

    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          targetRole: input.targetRole || null,
          scheduledFor: scheduledDate,
          createdById: actorId,
        },
        include: {
          createdBy: {
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
          action: 'ANNOUNCEMENT_CREATE',
          details: JSON.stringify({
            announcementId: created.id,
            title: created.title,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return created;
    });

    return announcement;
  }

  /**
   * Modify a notice announcement
   */
  async updateAnnouncement(id, input, actorId, ipAddress) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.announcement.update({
        where: { id },
        data: {
          title: input.title,
          content: input.content,
          targetRole: input.targetRole === null ? null : (input.targetRole || announcement.targetRole),
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : announcement.scheduledFor,
        },
        include: {
          createdBy: {
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
          action: 'ANNOUNCEMENT_UPDATE',
          details: JSON.stringify({
            announcementId: id,
            updatedFields: Object.keys(input),
          }),
          ipAddress: ipAddress || null,
        },
      });

      return u;
    });

    return updated;
  }

  /**
   * Delete a notice announcement
   */
  async deleteAnnouncement(id, actorId, ipAddress) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.announcement.delete({
        where: { id },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'ANNOUNCEMENT_DELETE',
          details: JSON.stringify({
            announcementId: id,
            title: announcement.title,
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return {
      id,
      deleted: true,
    };
  }

  /**
   * Fetch all notice announcements
   */
  async getAnnouncements() {
    return prisma.announcement.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [
        { scheduledFor: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}
