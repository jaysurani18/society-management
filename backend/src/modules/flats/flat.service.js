import prisma from '../../config/prisma.js';
import { BadRequestError } from '../../utils/customErrors.js';

export class FlatService {
  /**
   * Create a new flat asset and write to audit logs
   */
  async createFlat(input, userId, ipAddress) {
    const existingFlat = await prisma.flat.findUnique({
      where: {
        number_block: {
          number: input.flatNumber,
          block: input.buildingName,
        },
      },
    });

    if (existingFlat) {
      throw new BadRequestError(`Flat ${input.flatNumber} in building ${input.buildingName} already exists`);
    }

    const flat = await prisma.$transaction(async (tx) => {
      const createdFlat = await tx.flat.create({
        data: {
          number: input.flatNumber,
          block: input.buildingName,
          floor: input.floor,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          action: 'FLAT_CREATE',
          details: JSON.stringify({
            flatId: createdFlat.id,
            flatNumber: createdFlat.number,
            buildingName: createdFlat.block,
            floor: createdFlat.floor,
          }),
          ipAddress: ipAddress || null,
        },
      });

      return createdFlat;
    });

    return flat;
  }

  /**
   * Get all flats
   */
  async getAllFlats() {
    return prisma.flat.findMany({
      orderBy: [
        { block: 'asc' },
        { number: 'asc' },
      ],
    });
  }

  /**
   * Delete flat unit if not occupied
   */
  async deleteFlat(flatId, userId, ipAddress) {
    const existingOccupant = await prisma.residentProfile.findFirst({
      where: {
        flatId: flatId,
        status: 'OWNER',
      },
    });

    if (existingOccupant) {
      throw new BadRequestError('Cannot delete an occupied flat. Deactivate the resident first.');
    }

    const flat = await prisma.flat.findUnique({
      where: { id: flatId },
    });

    if (!flat) {
      throw new NotFoundError('Flat not found');
    }

    await prisma.$transaction(async (tx) => {
      // In case there are records referencing the flat, we also clear payment / bills if needed, 
      // or Prisma's onDelete: Restrict handles it. Let's delete bills first if empty flat.
      await tx.maintenanceBill.deleteMany({
        where: { flatId: flatId }
      });

      await tx.flat.delete({
        where: { id: flatId },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          action: 'FLAT_DELETE',
          details: JSON.stringify({
            flatId: flat.id,
            flatNumber: flat.number,
            buildingName: flat.block,
          }),
          ipAddress: ipAddress || null,
        },
      });
    });

    return true;
  }
}
