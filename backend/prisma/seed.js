import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Initiating database clean-up (Tear Down)...');

  // Tear down in correct relational order to avoid constraint errors
  await prisma.auditLog.deleteMany();
  console.log('🗑️  Cleared AuditLog table');

  await prisma.paymentRecord.deleteMany();
  console.log('🗑️  Cleared PaymentRecord table');

  await prisma.maintenanceBill.deleteMany();
  console.log('🗑️  Cleared MaintenanceBill table');

  await prisma.complaintComment.deleteMany();
  console.log('🗑️  Cleared ComplaintComment table');

  await prisma.complaint.deleteMany();
  console.log('🗑️  Cleared Complaint table');

  await prisma.serviceRequest.deleteMany();
  console.log('🗑️  Cleared ServiceRequest table');

  await prisma.residentProfile.deleteMany();
  console.log('🗑️  Cleared ResidentProfile table');

  await prisma.committeeProfile.deleteMany();
  console.log('🗑️  Cleared CommitteeProfile table');

  await prisma.user.deleteMany();
  console.log('🗑️  Cleared User table');

  await prisma.flat.deleteMany();
  console.log('🗑️  Cleared Flat table');

  console.log('✅ Database clean-up complete.');

  console.log('🌱 Seeding sample Flat properties...');
  const flat101 = await prisma.flat.create({ data: { block: 'Wing A', number: '101', floor: 1 } });
  const flat102 = await prisma.flat.create({ data: { block: 'Wing A', number: '102', floor: 1 } });
  const flat401 = await prisma.flat.create({ data: { block: 'Wing B', number: '401', floor: 4 } });
  const flat402 = await prisma.flat.create({ data: { block: 'Wing B', number: '402', floor: 4 } });
  console.log('🏢 Flat items seeded successfully.');

  console.log('🌱 Hashing credentials passwords...');
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
  const residentPassword = await bcrypt.hash('Resident@123', saltRounds);
  const committeePassword = await bcrypt.hash('Committee@123', saltRounds);

  console.log('🌱 Seeding role accounts...');

  // 1. Admin Account
  const admin = await prisma.user.create({
    data: {
      email: 'admin@society.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '1111111111',
      isActive: true,
    },
  });
  console.log(`👤 Master Admin seeded: ${admin.email}`);

  // 2. Resident Account
  const resident = await prisma.user.create({
    data: {
      email: 'resident@society.com',
      password: residentPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'RESIDENT',
      phone: '2222222222',
      isActive: true,
      residentProfile: {
        create: {
          flatId: flat101.id,
          status: 'OWNER',
        },
      },
    },
  });
  console.log(`👤 Resident seeded: ${resident.email} (Flat: Wing A - 101)`);

  // 3. Committee Account
  const committee = await prisma.user.create({
    data: {
      email: 'committee@society.com',
      password: committeePassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'COMMITTEE',
      phone: '3333333333',
      isActive: true,
      committeeProfile: {
        create: {
          designation: 'Treasurer',
          termStart: new Date(),
        },
      },
    },
  });
  console.log(`👤 Committee Member seeded: ${committee.email} (Designation: Treasurer)`);

  // Create initial log entry
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      details: JSON.stringify({
        message: 'System database initialization and core test users seeding completed successfully',
        seeder: 'prisma/seed.js',
      }),
    },
  });

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding process encountered an error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Disconnected Prisma client');
  });
