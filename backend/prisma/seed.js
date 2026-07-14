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
  console.log('🌱 Seeding Master Admin account...');

  // Hash the admin password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Admin@123', salt);

  // Seed the admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@society.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '1234567890',
      isActive: true,
    },
  });

  console.log(`👤 Master Admin seeded with ID: ${admin.id}`);

  // Create initial log entry
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      details: JSON.stringify({
        message: 'System database initialization and admin seeding completed successfully',
        seeder: 'prisma/seed.js',
      }),
    },
  });

  console.log('🌱 Seeding sample Flat properties...');

  const flatsData = [
    { block: 'Wing A', number: '101', floor: 1 },
    { block: 'Wing A', number: '102', floor: 1 },
    { block: 'Wing B', number: '401', floor: 4 },
    { block: 'Wing B', number: '402', floor: 4 },
  ];

  for (const flat of flatsData) {
    const createdFlat = await prisma.flat.create({
      data: flat,
    });
    console.log(`🏢 Seeded Property flat: ${createdFlat.block} - Room ${createdFlat.number} (Floor ${createdFlat.floor})`);
  }

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
