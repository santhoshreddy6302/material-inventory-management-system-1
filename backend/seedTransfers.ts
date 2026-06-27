import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Stock Transfers...');
  
  const sites = await prisma.site.findMany();
  const materials = await prisma.material.findMany();
  const users = await prisma.user.findMany();

  if (sites.length >= 2 && materials.length >= 1 && users.length >= 1) {
    const admin = users.find(u => u.role === 'admin') || users[0];

    const transfersData = [
      {
        transferCode: 'TRF-001001',
        fromSiteId: sites[0].id,
        toSiteId: sites[1].id,
        materialId: materials[0].id,
        quantity: 50,
        transferDate: new Date(),
        status: 'approved',
        reason: 'Urgent requirement for foundation casting',
        requestedBy: admin.id,
        approvedBy: admin.id
      },
      {
        transferCode: 'TRF-001002',
        fromSiteId: sites[1].id,
        toSiteId: sites[0].id,
        materialId: materials[1].id,
        quantity: 2,
        transferDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
        status: 'pending',
        reason: 'Excess steel transfer',
        requestedBy: admin.id
      },
      {
        transferCode: 'TRF-001003',
        fromSiteId: sites[0].id,
        toSiteId: sites[2].id,
        materialId: materials[2].id,
        quantity: 1000,
        transferDate: new Date(Date.now() - 86400000 * 5), // 5 days ago
        status: 'rejected',
        reason: 'Requested blocks are not available',
        requestedBy: admin.id,
        approvedBy: admin.id
      }
    ];

    for (const data of transfersData) {
      await prisma.stockTransfer.create({ data });
    }
    
    console.log('Stock Transfers seeded successfully!');
  } else {
    console.log('Not enough sites/materials/users to seed transfers.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
