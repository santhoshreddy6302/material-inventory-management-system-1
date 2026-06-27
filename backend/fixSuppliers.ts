import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Purchase Orders for unused suppliers...');

  const suppliers = await prisma.supplier.findMany();
  const sites = await prisma.site.findMany();
  const materials = await prisma.material.findMany();
  const procurement = await prisma.user.findFirst({ where: { role: 'procurement_staff' } });
  const project = await prisma.project.findFirst({ where: { status: 'active' } });

  if (suppliers.length < 5 || sites.length === 0 || materials.length === 0 || !procurement || !project) {
    console.log('Missing prerequisite data');
    return;
  }

  // Find Electro Supplies and Pipe Masters Ltd
  const electro = suppliers.find(s => s.name.includes('Electro'));
  const pipe = suppliers.find(s => s.name.includes('Pipe'));

  if (electro) {
    const exists = await prisma.purchaseOrder.findUnique({ where: { poNumber: 'PO-2026-006' } });
    if (!exists) {
      await prisma.purchaseOrder.create({
        data: {
          poNumber: 'PO-2026-006',
          supplierId: electro.id,
          projectId: project.id,
          siteId: sites[0].id,
          orderDate: new Date('2026-06-25'),
          subtotal: 45000,
          taxAmount: 8100, // 18%
          totalAmount: 53100,
          status: 'ordered',
          paymentStatus: 'paid',
          createdBy: procurement.id,
          items: {
            create: [
              {
                materialId: materials.find(m => m.name.includes('Electrical') || m.name.includes('Wire'))?.id || materials[0].id,
                quantity: 25,
                unitPrice: 1800,
                totalPrice: 45000
              }
            ]
          }
        }
      });
    }
  }

  if (pipe) {
    const exists = await prisma.purchaseOrder.findUnique({ where: { poNumber: 'PO-2026-007' } });
    if (!exists) {
      await prisma.purchaseOrder.create({
        data: {
          poNumber: 'PO-2026-007',
          supplierId: pipe.id,
          projectId: project.id,
          siteId: sites[0].id,
          orderDate: new Date('2026-06-26'),
          subtotal: 75000,
          taxAmount: 13500, // 18%
          totalAmount: 88500,
          status: 'approved',
          paymentStatus: 'pending',
          createdBy: procurement.id,
          items: {
            create: [
              {
                materialId: materials.find(m => m.name.includes('Pipe') || m.name.includes('PVC'))?.id || materials[0].id,
                quantity: 150,
                unitPrice: 500,
                totalPrice: 75000
              }
            ]
          }
        }
      });
    }
  }

  console.log('Successfully added orders for Electro Supplies and Pipe Masters!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
