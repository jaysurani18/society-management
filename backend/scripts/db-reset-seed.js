import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runResetAndSeed() {
  try {
    console.log('Wiping database...');

    // Relational reverse-dependency order deletion
    await prisma.auditLog.deleteMany();
    await prisma.paymentRecord.deleteMany();
    await prisma.maintenanceBill.deleteMany();
    await prisma.complaintComment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.residentProfile.deleteMany();
    await prisma.committeeProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.flat.deleteMany();

    console.log('Seeding base physical flats infrastructure...');
    // Seed exactly 4 physical empty Flat units
    await prisma.flat.create({ data: { block: 'Wing A', number: '101', floor: 1 } });
    await prisma.flat.create({ data: { block: 'Wing A', number: '102', floor: 1 } });
    await prisma.flat.create({ data: { block: 'Wing B', number: '201', floor: 2 } });
    await prisma.flat.create({ data: { block: 'Wing B', number: '202', floor: 2 } });

    console.log('Seeding system administrator...');

    // Password Encryption
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('Admin@123', saltRounds);

    // Admin Profile
    await prisma.user.create({
      data: {
        email: 'admin@society.com',
        password: adminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMIN',
        phone: '1111111111',
        isActive: true,
      },
    });

    console.log('Reset complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset and Seeding pipeline failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runResetAndSeed();
