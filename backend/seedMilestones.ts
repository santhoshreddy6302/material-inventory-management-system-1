import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding more Milestones...');

  const project = await prisma.project.findFirst({ where: { status: 'active' } });

  if (!project) {
    console.log('Missing project data');
    return;
  }

  // Add 2 more milestones to make sure we have at least 5
  const milestonesData = [
    {
      projectId: project.id,
      milestoneName: 'Initial Requirements Gathering',
      amount: 15000,
      dueDate: new Date('2026-06-02'),
      status: 'completed',
    },
    {
      projectId: project.id,
      milestoneName: 'System Architecture Design',
      amount: 20000,
      dueDate: new Date('2026-06-10'),
      status: 'completed',
    }
  ];

  for (const m of milestonesData) {
    await prisma.paymentMilestone.create({ data: m });
  }

  console.log('Successfully added more Milestones!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
