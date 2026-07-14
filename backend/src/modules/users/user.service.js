import prisma from '../../config/prisma.js';
import { NotFoundError } from '../../utils/customErrors.js';

export class UserService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(userId, data, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName !== undefined ? data.firstName : undefined,
          lastName: data.lastName !== undefined ? data.lastName : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });

      // Audit Log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'PROFILE_UPDATE',
          details: JSON.stringify({
            updatedFields: Object.keys(data).filter(k => data[k] !== undefined),
          }),
          ipAddress: ipAddress || null,
        },
      });

      return u;
    });

    return updated;
  }
}
