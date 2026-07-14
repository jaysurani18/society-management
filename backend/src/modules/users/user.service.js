import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
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
        residentProfile: {
          include: {
            flat: true,
          },
        },
        committeeProfile: true,
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
          residentProfile: {
            include: {
              flat: true,
            },
          },
          committeeProfile: true,
        },
      });

      if (u.role === 'RESIDENT' && (data.emergencyName !== undefined || data.emergencyPhone !== undefined || data.vehicleNumber !== undefined)) {
        await tx.residentProfile.update({
          where: { userId },
          data: {
            emergencyName: data.emergencyName !== undefined ? data.emergencyName : undefined,
            emergencyPhone: data.emergencyPhone !== undefined ? data.emergencyPhone : undefined,
            vehicleNumber: data.vehicleNumber !== undefined ? data.vehicleNumber : undefined,
          },
        });
      }

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

  async adminResetPassword(targetUserId, newPassword, actorId, ipAddress) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { password: passwordHash },
      });

      // Audit Log entry
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'ADMIN_RESET_USER_PASSWORD',
          details: JSON.stringify({
            targetUserId,
            email: user.email,
            message: 'User password reset by administrator',
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return { success: true };
  }
}
