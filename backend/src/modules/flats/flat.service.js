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
}
