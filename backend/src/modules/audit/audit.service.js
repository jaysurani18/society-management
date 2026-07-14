import prisma from '../../config/prisma.js';

export class AuditService {
  /**
   * Fetch paginated and filterable system audit logs (Admin only)
   */
  async getLogs(params) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { action, userId } = params;

    const where = {};

    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive',
      };
    }

    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
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
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
