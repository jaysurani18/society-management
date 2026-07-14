import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/customErrors.js';

export class ResidentService {
  /**
   * Onboard a new resident (creates User and ResidentProfile in a transaction)
   */
  async onboardResident(input, actorId, ipAddress) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new BadRequestError('A user with this email address already exists');
    }

    const flat = await prisma.flat.findUnique({
      where: { id: input.flatId },
    });

    if (!flat) {
      throw new NotFoundError('Target flat does not exist');
    }

    // Hash the password (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const residentProfile = await prisma.$transaction(async (tx) => {
      // Create User with role RESIDENT
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: 'RESIDENT',
        },
      });

      // Create ResidentProfile
      const profile = await tx.residentProfile.create({
        data: {
          userId: user.id,
          flatId: input.flatId,
          status: input.status,
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
          flat: true,
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'RESIDENT_ONBOARD',
          details: JSON.stringify({
            residentProfileId: profile.id,
            userId: user.id,
            flatId: profile.flatId,
            status: profile.status,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return profile;
    });

    return residentProfile;
  }

  /**
   * Find an active OWNER by flat ID
   */
  async findActiveOwnerByFlatId(flatId) {
    return prisma.residentProfile.findFirst({
      where: {
        flatId: flatId,
        status: 'OWNER',
      },
    });
  }

  /**
   * Fetch all residents using pagination, search, and status filters
   */
  async getResidents(params) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { search, status } = params;

    // Build the query where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          user: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          flat: {
            number: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [residents, total] = await prisma.$transaction([
      prisma.residentProfile.findMany({
        where,
        skip,
        take: limit,
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
          flat: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.residentProfile.count({ where }),
    ]);

    return {
      residents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetch a single resident by ID
   */
  async getResidentById(id, actorId, actorRole) {
    const profile = await prisma.residentProfile.findUnique({
      where: { id },
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
        flat: true,
      },
    });

    if (!profile) {
      throw new NotFoundError('Resident profile not found');
    }

    // RBAC verification: If not ADMIN/COMMITTEE, the authenticated user must match the profile's userId
    if (actorRole === 'RESIDENT' && profile.userId !== actorId) {
      throw new ForbiddenError('You do not have permission to view this profile');
    }

    return profile;
  }

  /**
   * Update resident details and write to audit logs
   */
  async updateResident(id, input, actorId, ipAddress) {
    const profile = await prisma.residentProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundError('Resident profile not found');
    }

    // If flatId is modified, make sure it is valid
    if (input.flatId) {
      const flat = await prisma.flat.findUnique({
        where: { id: input.flatId },
      });
      if (!flat) {
        throw new NotFoundError('Target flat does not exist');
      }
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Update User details if supplied
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

      // Update ResidentProfile details
      const updated = await tx.residentProfile.update({
        where: { id },
        data: {
          flatId: input.flatId,
          status: input.status,
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
          flat: true,
        },
      });

      // Append Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'RESIDENT_UPDATE',
          details: JSON.stringify({
            residentProfileId: id,
            updatedFields: Object.keys(input),
          }),
          ipAddress: ipAddress || null,
        },
      });

      return updated;
    });

    return updatedProfile;
  }

  /**
   * Soft delete a resident (switch status to 'LEFT' and User.isActive to false)
   */
  async deleteResident(id, actorId, ipAddress) {
    const profile = await prisma.residentProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundError('Resident profile not found');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Switch status to 'LEFT'
      await tx.residentProfile.update({
        where: { id },
        data: {
          status: 'LEFT',
        },
      });

      // 2. Set User.isActive to false
      await tx.user.update({
        where: { id: profile.userId },
        data: {
          isActive: false,
        },
      });

      // 3. Create audit record
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'RESIDENT_SOFT_DELETE',
          details: JSON.stringify({
            residentProfileId: id,
            userId: profile.userId,
            statusChangedTo: 'LEFT',
            userIsActiveChangedTo: false,
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return {
      id,
      status: 'LEFT',
      isActive: false,
    };
  }
}
