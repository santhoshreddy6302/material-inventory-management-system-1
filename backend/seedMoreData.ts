import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding more required data (All Tasks & 5+ POs)...');
  
  let project = await prisma.project.findUnique({ where: { projectCode: 'PRJ-INTERN-01' } });
  if (!project) {
    project = await prisma.project.findFirst();
  }
  
  if (project) {
    // Delete any existing subcontractor tasks first to make room for realistic data
    await prisma.subcontractorTask.deleteMany({ where: { projectId: project.id } });

    const subcontractorTasksData = [
      {
        projectId: project.id,
        subcontractorName: 'GroundForce Excavations',
        taskDescription: 'Site clearing, excavation, and leveling for foundation work',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        status: 'completed',
        cost: 150000
      },
      {
        projectId: project.id,
        subcontractorName: 'Apex Concrete Solutions',
        taskDescription: 'Pouring foundation concrete footing and pile cap reinforcement',
        startDate: new Date('2026-06-06'),
        endDate: new Date('2026-06-12'),
        status: 'completed',
        cost: 280000
      },
      {
        projectId: project.id,
        subcontractorName: 'BuildCraft Masonry Ltd',
        taskDescription: 'Ground floor brickwork masonry and partition wall layout',
        startDate: new Date('2026-06-13'),
        endDate: new Date('2026-06-20'),
        status: 'completed',
        cost: 185000
      },
      {
        projectId: project.id,
        subcontractorName: 'FlowTech Plumbing & Piping',
        taskDescription: 'Underground drainage pipes layout and sewage line connections',
        startDate: new Date('2026-06-14'),
        endDate: new Date('2026-06-18'),
        status: 'completed',
        cost: 95000
      },
      {
        projectId: project.id,
        subcontractorName: 'VoltSync Electricals',
        taskDescription: 'Conduit laying for electrical wiring in ground floor walls and slabs',
        startDate: new Date('2026-06-16'),
        endDate: new Date('2026-06-21'),
        status: 'completed',
        cost: 110000
      },
      {
        projectId: project.id,
        subcontractorName: 'ShieldGuard Waterproofing',
        taskDescription: 'Basement wall waterproofing and retaining wall protective coating',
        startDate: new Date('2026-06-19'),
        endDate: new Date('2026-06-23'),
        status: 'completed',
        cost: 75000
      },
      {
        projectId: project.id,
        subcontractorName: 'Apex Concrete Solutions',
        taskDescription: 'Casting columns and beams for the first floor roof slab',
        startDate: new Date('2026-06-22'),
        endDate: new Date('2026-06-28'),
        status: 'completed',
        cost: 320000
      },
      {
        projectId: project.id,
        subcontractorName: 'BuildCraft Masonry Ltd',
        taskDescription: 'First floor brick wall masonry and window frame fixing',
        startDate: new Date('2026-06-25'),
        endDate: new Date('2026-07-02'),
        status: 'in_progress',
        cost: 190000
      },
      {
        projectId: project.id,
        subcontractorName: 'VoltSync Electricals',
        taskDescription: 'Pulling wires and installing sub-distribution boards for first floor',
        startDate: new Date('2026-06-28'),
        endDate: new Date('2026-07-05'),
        status: 'in_progress',
        cost: 130000
      },
      {
        projectId: project.id,
        subcontractorName: 'FlowTech Plumbing & Piping',
        taskDescription: 'Installing bathroom vertical soil/waste pipes and supply lines',
        startDate: new Date('2026-06-29'),
        endDate: new Date('2026-07-06'),
        status: 'in_progress',
        cost: 115000
      },
      {
        projectId: project.id,
        subcontractorName: 'ProFinish Drywall & Plaster',
        taskDescription: 'Internal plastering and wall putty application for ground floor',
        startDate: new Date('2026-07-02'),
        endDate: new Date('2026-07-12'),
        status: 'pending',
        cost: 140000
      },
      {
        projectId: project.id,
        subcontractorName: 'Elite Tiles & Stones',
        taskDescription: 'Laying vitrified flooring tiles and bathroom wall cladding',
        startDate: new Date('2026-07-08'),
        endDate: new Date('2026-07-22'),
        status: 'pending',
        cost: 220000
      },
      {
        projectId: project.id,
        subcontractorName: 'SafeGuard Fire Systems',
        taskDescription: 'Installing fire sprinkler main lines and smoke detector conduits',
        startDate: new Date('2026-07-10'),
        endDate: new Date('2026-07-20'),
        status: 'pending',
        cost: 165000
      },
      {
        projectId: project.id,
        subcontractorName: 'DecoStyle Painters',
        taskDescription: 'Applying primer coat and interior emulsion paints for ground floor',
        startDate: new Date('2026-07-15'),
        endDate: new Date('2026-07-25'),
        status: 'pending',
        cost: 85000
      }
    ];

    for (const t of subcontractorTasksData) {
      await prisma.subcontractorTask.create({ data: t });
    }
  }

  // Add 3 more Purchase Orders to satisfy "Test at least 5 records with different statuses"
  const suppliers = await prisma.supplier.findMany();
  const sites = await prisma.site.findMany();
  const materials = await prisma.material.findMany();
  const procurement = await prisma.user.findFirst({ where: { role: 'procurement_staff' } });

  if (suppliers.length > 0 && sites.length > 0 && materials.length > 0 && procurement) {
    const poData = [
      {
        poNumber: 'PO-2026-003',
        status: 'draft',
        total: 45000
      },
      {
        poNumber: 'PO-2026-004',
        status: 'rejected',
        total: 12500
      },
      {
        poNumber: 'PO-2026-005',
        status: 'delivered',
        total: 89000
      }
    ];

    for (const po of poData) {
      const exists = await prisma.purchaseOrder.findUnique({ where: { poNumber: po.poNumber } });
      if (!exists) {
        await prisma.purchaseOrder.create({
          data: {
            poNumber: po.poNumber,
            supplierId: suppliers[0].id,
            siteId: sites[0].id,
            orderDate: new Date(),
            subtotal: po.total,
            taxAmount: 0,
            totalAmount: po.total,
            status: po.status,
            paymentStatus: 'pending',
            createdBy: procurement.id,
            items: {
              create: [
                {
                  materialId: materials[0].id,
                  quantity: 10,
                  unitPrice: po.total / 10,
                  totalPrice: po.total
                }
              ]
            }
          }
        });
      }
    }
  }

  console.log('More data successfully seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
