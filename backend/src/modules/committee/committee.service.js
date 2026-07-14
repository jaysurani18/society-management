import prisma from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../utils/customErrors.js';

export class CommitteeService {
  /**
   * Promote a standard User to COMMITTEE role and build their CommitteeProfile record
   */
  async promoteToCommittee(input, actorId, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { committeeProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.committeeProfile) {
      throw new BadRequestError('User is already a committee member');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upgrade User role to COMMITTEE
      const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: {
          role: 'COMMITTEE',
        },
      });

      // 2. Build CommitteeProfile record
      const committeeProfile = await tx.committeeProfile.create({
        data: {
          userId: input.userId,
          designation: input.responsibility,
          termStart: input.termStart,
          termEnd: input.termEnd,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      // 3. Write privilege alteration audit log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'COMMITTEE_PROMOTE',
          details: JSON.stringify({
            targetUserId: input.userId,
            responsibility: input.responsibility,
            assignedBy: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return committeeProfile;
    });

    return result;
  }

  /**
   * Update committee member's responsibility or details
   */
  async updateCommittee(id, input, actorId, ipAddress) {
    const profile = await prisma.committeeProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundError('Committee member profile not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update User fields if provided
      if (input.firstName || input.lastName || input.phone) {
        await tx.user.update({
          where: { id: profile.userId },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
        });
      }

      // Update CommitteeProfile fields
      const updated = await tx.committeeProfile.update({
        where: { id },
        data: {
          designation: input.responsibility,
          termStart: input.termStart,
          termEnd: input.termEnd,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      // Append Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'COMMITTEE_UPDATE',
          details: JSON.stringify({
            committeeProfileId: id,
            updatedFields: Object.keys(input),
          }),
          ipAddress: ipAddress || null,
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Downgrade committee member (remove CommitteeProfile and change role back to RESIDENT)
   */
  async downgradeCommittee(id, actorId, ipAddress) {
    const profile = await prisma.committeeProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundError('Committee member profile not found');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete CommitteeProfile tuple
      await tx.committeeProfile.delete({
        where: { id },
      });

      // 2. Change base User.role back to RESIDENT
      await tx.user.update({
        where: { id: profile.userId },
        data: {
          role: 'RESIDENT',
        },
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'COMMITTEE_DOWNGRADE',
          details: JSON.stringify({
            downgradedUserId: profile.userId,
            committeeProfileId: id,
            downgradedBy: actorId,
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return {
      id,
      userId: profile.userId,
      role: 'RESIDENT',
    };
  }

  /**
   * Get all active committee member profiles
   */
  async getAllActiveCommittee() {
    return prisma.committeeProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
