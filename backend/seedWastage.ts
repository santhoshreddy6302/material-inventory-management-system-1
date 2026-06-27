import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding more Wastage Records...');

  const engineer = await prisma.user.findFirst({ where: { role: 'site_engineer' } });
  const sites = await prisma.site.findMany();
  const materials = await prisma.material.findMany();

  if (!engineer || sites.length === 0 || materials.length === 0) {
    console.log('Missing prerequisite data');
    return;
  }

  const wastageData = [
    {
      wastageCode: 'WST-001004',
      materialId: materials[1].id,
      siteId: sites[0].id,
      quantityWasted: 12,
      unitCost: 1500,
      totalCost: 18000,
      reason: 'Theft',
      preventable: true,
      wastageDate: new Date('2026-06-24'),
      recordedBy: engineer.id
    },
    {
      wastageCode: 'WST-001005',
      materialId: materials[2].id,
      siteId: sites[1].id,
      quantityWasted: 4,
      unitCost: 800,
      totalCost: 3200,
      reason: 'Expiration',
      preventable: true,
      wastageDate: new Date('2026-06-25'),
      recordedBy: engineer.id
    },
    {
      wastageCode: 'WST-001006',
      materialId: materials[0].id,
      siteId: sites[0].id,
      quantityWasted: 50,
      unitCost: 400,
      totalCost: 20000,
      reason: 'Damage',
      preventable: false,
      wastageDate: new Date('2026-06-26'),
      recordedBy: engineer.id
    }
  ];

  for (const w of wastageData) {
    const exists = await prisma.wastageRecord.findUnique({ where: { wastageCode: w.wastageCode } });
    if (!exists) {
      await prisma.wastageRecord.create({ data: w });
    }
  }

  // Let's also add more Usage records just in case!
  const usageData = [
    {
      usageCode: 'USE-001006',
      materialId: materials[1].id,
      siteId: sites[0].id,
      quantityUsed: 40,
      totalCost: 60000,
      purpose: 'Wall construction',
      usageDate: new Date('2026-06-25'),
      recordedBy: engineer.id
    },
    {
      usageCode: 'USE-001007',
      materialId: materials[2].id,
      siteId: sites[1].id,
      quantityUsed: 15,
      totalCost: 12000,
      purpose: 'Flooring',
      usageDate: new Date('2026-06-26'),
      recordedBy: engineer.id
    }
  ];

  for (const u of usageData) {
    const exists = await prisma.materialUsage.findUnique({ where: { usageCode: u.usageCode } });
    if (!exists) {
      await prisma.materialUsage.create({ data: u });
    }
  }

  console.log('Successfully added more Wastage & Usage records!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
