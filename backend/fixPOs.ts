import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing missing Project IDs for Purchase Orders...');
  
  const site = await prisma.site.findFirst({
    where: { name: { contains: 'Greenfield Block A' } },
    include: { project: true }
  });

  if (site && site.projectId) {
    const updated = await prisma.purchaseOrder.updateMany({
      where: { poNumber: { in: ['PO-2026-003', 'PO-2026-004', 'PO-2026-005'] } },
      data: { projectId: site.projectId }
    });
    console.log(`Successfully updated ${updated.count} Purchase Orders with the correct Project ID.`);
  } else {
    console.log('Could not find the site or its associated project.');
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
