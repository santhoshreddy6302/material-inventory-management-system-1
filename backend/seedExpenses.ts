import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding more Project Expenses...');

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  const project = await prisma.project.findFirst({ where: { status: 'active' } });

  if (!admin || !project) {
    console.log('Missing prerequisite data');
    return;
  }

  const expensesData = [
    {
      projectId: project.id,
      category: 'Transportation',
      amount: 12500,
      expenseDate: new Date('2026-06-25'),
      description: 'Material transportation to Site B',
      incurredBy: 'Amit Singh',
      recordedBy: admin.id
    },
    {
      projectId: project.id,
      category: 'Equipment Maintenance',
      amount: 8200,
      expenseDate: new Date('2026-06-23'),
      description: 'Concrete mixer servicing',
      incurredBy: 'Raj Kumar',
      recordedBy: admin.id
    },
    {
      projectId: project.id,
      category: 'Office Supplies',
      amount: 3400,
      expenseDate: new Date('2026-06-22'),
      description: 'Stationery and printer ink for site office',
      incurredBy: 'Sunita Verma',
      recordedBy: admin.id
    },
    {
      projectId: project.id,
      category: 'Miscellaneous',
      amount: 5000,
      expenseDate: new Date('2026-06-20'),
      description: 'Client visit refreshments',
      incurredBy: 'Admin',
      recordedBy: admin.id
    }
  ];

  for (const exp of expensesData) {
    await prisma.projectExpense.create({ data: exp });
  }

  // Also fix the first expense if its date is null/missing
  const existing = await prisma.projectExpense.findFirst({ where: { description: { contains: 'Diesel' } } });
  if (existing && !existing.expenseDate) {
      await prisma.projectExpense.update({
          where: { id: existing.id },
          data: { expenseDate: new Date('2026-06-26') }
      });
  }

  console.log('Successfully added more Project Expenses!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
