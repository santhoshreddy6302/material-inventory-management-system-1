import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PDF specific data...');
  
  const hash = await bcrypt.hash('Student@123', 10);
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });

  if (!admin) {
    console.log('Admin user not found. Cannot proceed.');
    return;
  }

  // 1. Add Users from the PDF
  const users = [
    { name: 'Student 1 - Frontend', email: 'student1@avinashinfra.com', role: 'site_engineer', isActive: true },
    { name: 'Student 2 - Backend', email: 'student2@avinashinfra.com', role: 'site_engineer', isActive: true },
    { name: 'Student 3 - Testing', email: 'student3@avinashinfra.com', role: 'site_engineer', isActive: true },
    { name: 'Instructor', email: 'instructor@avinashinfra.com', role: 'admin', isActive: true }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash }
    });
  }

  // 2. Add Project from the PDF
  const project = await prisma.project.upsert({
    where: { projectCode: 'PRJ-INTERN-01' },
    update: {},
    create: {
      projectCode: 'PRJ-INTERN-01',
      name: 'Material Inventory Management System Prototype',
      description: 'Internship reference implementation tracking cement, steel, bricks, sand, tiles, pipes, electrical items',
      clientName: 'AVINASH KANAPARTHI INFRA PRIVATE LIMITED',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      budget: 0,
      status: 'active',
      managerId: admin.id,
      createdBy: admin.id,
    }
  });

  // 3. Add Milestones from PDF
  const milestones = [
    { milestoneName: 'Review 1 (Problem Statement, Abstract)', dueDate: new Date('2026-06-06') },
    { milestoneName: 'Review 2 (Literature Survey, DB Design)', dueDate: new Date('2026-06-19') },
    { milestoneName: 'Review 3 (Final Prototype Demo)', dueDate: new Date('2026-06-29') }
  ];

  for (const m of milestones) {
    const exists = await prisma.paymentMilestone.findFirst({
      where: { projectId: project.id, milestoneName: m.milestoneName }
    });
    if (!exists) {
      await prisma.paymentMilestone.create({
        data: { projectId: project.id, milestoneName: m.milestoneName, amount: 0, dueDate: m.dueDate, status: 'pending' }
      });
    }
  }

  // 4. Add Tasks from PDF Day-wise plan
  const tasks = [
    { name: 'Student 1 - Frontend', desc: 'Day 1-4: Wireframes, UI Setup, React components', start: '2026-06-01', end: '2026-06-04' },
    { name: 'Student 2 - Backend', desc: 'Day 1-4: API Design, DB Schema, Express setup', start: '2026-06-01', end: '2026-06-04' },
    { name: 'Student 3 - Testing', desc: 'Day 1-4: GitHub Setup, Test Cases, Deployment plan', start: '2026-06-01', end: '2026-06-04' },
    { name: 'Student 1 - Frontend', desc: 'Day 13-16: Core Logic Design, Workflow Plan, Connect API', start: '2026-06-15', end: '2026-06-18' },
    { name: 'Student 2 - Backend', desc: 'Day 13-16: Rule document, Processing function, Test Logic', start: '2026-06-15', end: '2026-06-18' },
    { name: 'Student 3 - Testing', desc: 'Day 21-26: Final Testing, Bug Fixes, Report Writing, Demo', start: '2026-06-24', end: '2026-06-30' },
  ];

  for (const t of tasks) {
    const exists = await prisma.subcontractorTask.findFirst({
      where: { projectId: project.id, subcontractorName: t.name, taskDescription: t.desc }
    });
    if (!exists) {
      await prisma.subcontractorTask.create({
        data: {
          projectId: project.id,
          subcontractorName: t.name,
          taskDescription: t.desc,
          startDate: new Date(t.start),
          endDate: new Date(t.end),
          status: 'pending',
          cost: 0
        }
      });
    }
  }

  console.log('PDF Data successfully seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
