import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create wards
  const wards = [
    { code: '01', name: 'Central Ward' },
    { code: '02', name: 'North Ward' },
    { code: '03', name: 'South Ward' },
    { code: '04', name: 'East Ward' },
    { code: '05', name: 'West Ward' },
    { code: '06', name: 'Northeast Ward' },
    { code: '07', name: 'Northwest Ward' },
    { code: '08', name: 'Southeast Ward' },
    { code: '09', name: 'Southwest Ward' },
    { code: '10', name: 'Central North Ward' },
    { code: '11', name: 'Central South Ward' },
    { code: '12', name: 'Central East Ward' },
  ];

  console.log('Creating wards...');
  const createdWards = [];
  for (const ward of wards) {
    const createdWard = await prisma.ward.upsert({
      where: { code: ward.code },
      update: {},
      create: ward,
    });
    createdWards.push(createdWard);
  }

  // Create roles
  const roles = [
    'CAO',
    'Admin',
    'Planning Officer',
    'Technical Head',
    'Ward Secretary',
    'Accounts Officer',
    'Project Manager',
  ];

  console.log('Creating roles...');
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  // Create a test user
  console.log('Creating test user...');
  const testUser = await prisma.user.upsert({
    where: { email: 'admin@municipality.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@municipality.com',
      hashedPassword: 'hashed_password_here', // In real app, hash this properly
    },
  });

  // Create some sample programs
  console.log('Creating sample programs...');
  const samplePrograms = [
    {
      code: 'PRG-2025-0001',
      name: 'Road Maintenance and Upgradation Project',
      fiscalYear: '2025/26',
      budget: 2500000,
      fundingSource: 'RED_BOOK',
      programType: 'NEW',
      description: 'Comprehensive road maintenance and upgrading project covering major arterial roads in Ward 12.',
      status: 'DRAFT',
      wardCode: '12',
      createdById: testUser.id,
      tags: ['road', 'maintenance', 'infrastructure'],
      responsibleOfficer: 'Planning Officer',
    },
    {
      code: 'PRG-2025-0002',
      name: 'Water Supply Upgrade Project',
      fiscalYear: '2025/26',
      budget: 1800000,
      fundingSource: 'EXECUTIVE',
      programType: 'NEW',
      description: 'Upgrading water supply infrastructure in Ward 5 to improve water quality and distribution.',
      status: 'SUBMITTED',
      wardCode: '05',
      createdById: testUser.id,
      tags: ['water', 'infrastructure', 'upgrade'],
      responsibleOfficer: 'Technical Head',
    },
    {
      code: 'PRG-2025-0003',
      name: 'School Renovation Project',
      fiscalYear: '2025/26',
      budget: 3200000,
      fundingSource: 'RED_BOOK',
      programType: 'CARRIED_OVER',
      description: 'Renovation and modernization of primary school buildings in Ward 8.',
      status: 'APPROVED',
      wardCode: '08',
      createdById: testUser.id,
      tags: ['education', 'renovation', 'school'],
      responsibleOfficer: 'Project Manager',
    },
  ];

  for (const programData of samplePrograms) {
    const ward = createdWards.find(w => w.code === programData.wardCode);
    if (ward) {
      await prisma.program.upsert({
        where: { code: programData.code },
        update: {},
        create: {
          code: programData.code,
          name: programData.name,
          fiscalYear: programData.fiscalYear,
          budget: programData.budget,
          fundingSource: programData.fundingSource,
          programType: programData.programType,
          description: programData.description,
          status: programData.status,
          wardId: ward.id,
          createdById: programData.createdById,
          tags: programData.tags,
          responsibleOfficer: programData.responsibleOfficer,
        },
      });
    } else {
      console.warn(`Warning: Ward ${programData.wardCode} not found for program ${programData.code}`);
    }
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 