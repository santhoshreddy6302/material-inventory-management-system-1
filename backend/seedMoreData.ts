import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding more required data (All Tasks & 5+ POs)...');
  
  let project = await prisma.project.findUnique({ where: { projectCode: 'PRJ-INTERN-01' } });
  if (!project) {
    project = await prisma.project.findFirst();
  }
  
  if (project) {
    const tasks = [
      // Week 1
      { day: 5, date: '2026-06-05', title: 'Review 1 Preparation' },
      { day: 6, date: '2026-06-06', title: 'REVIEW PRESENTATION 1' },
      // Week 2
      { day: 7, date: '2026-06-08', title: 'Review 1 Feedback + Week 2 Prep' },
      { day: 8, date: '2026-06-09', title: 'Literature Survey + Existing System Analysis' },
      { day: 9, date: '2026-06-10', title: 'Proposed System Description + DB Design' },
      { day: 10, date: '2026-06-11', title: 'Database Setup + First Backend Route + Main Form' },
      { day: 11, date: '2026-06-12', title: 'List API + Dashboard HTML' },
      { day: 12, date: '2026-06-13', title: 'GitHub Workflow + Environment Validation' },
      // Week 3
      { day: 13, date: '2026-06-15', title: 'Core Logic Design + Workflow Plan' },
      { day: 14, date: '2026-06-16', title: 'Week 2 Review Prep + Literature Survey Final' },
      { day: 15, date: '2026-06-17', title: 'System Architecture Diagram + Full Stack Plan' },
      { day: 16, date: '2026-06-18', title: 'Connect Frontend Form to Backend API' },
      { day: 17, date: '2026-06-19', title: 'REVIEW PRESENTATION 2 - Day 1' },
      { day: 18, date: '2026-06-20', title: 'REVIEW PRESENTATION 2 - Day 2 + Core Feature Build' },
      // Week 4
      { day: 19, date: '2026-06-22', title: 'Core Workflow Complete + Alerts/Outputs' },
      { day: 20, date: '2026-06-23', title: 'Detail Page + Full Integration Test' },
      { day: 21, date: '2026-06-24', title: 'UI Polish + Error Handling' },
      { day: 22, date: '2026-06-25', title: 'Deployment Setup' },
      { day: 23, date: '2026-06-26', title: 'Final Testing + Bug Fixes + Report Part 1' },
      { day: 24, date: '2026-06-27', title: 'Project Report Part 2 + Demo Video + Final PPT' },
      // Week 5
      { day: 25, date: '2026-06-29', title: 'REVIEW PRESENTATION 3 - Day 1 + Final Submissions' },
      { day: 26, date: '2026-06-30', title: 'REVIEW PRESENTATION 3 - Day 2 + Internship Closing' },
    ];

    const students = ['Student 1 - Frontend', 'Student 2 - Backend', 'Student 3 - Testing'];

    for (const t of tasks) {
      for (const s of students) {
        const exists = await prisma.subcontractorTask.findFirst({
          where: { projectId: project.id, subcontractorName: s, taskDescription: `Day ${t.day}: ${t.title}` }
        });
        if (!exists) {
          await prisma.subcontractorTask.create({
            data: {
              projectId: project.id,
              subcontractorName: s,
              taskDescription: `Day ${t.day}: ${t.title}`,
              startDate: new Date(t.date),
              endDate: new Date(t.date),
              status: t.day <= 22 ? 'completed' : 'pending',
              cost: 0
            }
          });
        }
      }
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
