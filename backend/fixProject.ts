import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing empty fields for the Internship Project...');

  const project = await prisma.project.findUnique({
    where: { projectCode: 'PRJ-INTERN-01' }
  });

  if (project) {
    // 1. Update Project Location & Budget
    await prisma.project.update({
      where: { id: project.id },
      data: {
        location: 'HQ Office, Hyderabad',
        budget: 500000.00 // 5 Lakhs budget
      }
    });

    // 2. Add a Site for this project so Sites is no longer 0
    const manager = await prisma.user.findFirst({ where: { role: 'site_engineer' } });
    
    if (manager) {
      const existingSite = await prisma.site.findFirst({
        where: { projectId: project.id }
      });

      if (!existingSite) {
        await prisma.site.create({
          data: {
            siteCode: 'SITE-INTERN-01',
            projectId: project.id,
            name: 'Software Development Lab',
            location: 'HQ Office, Hyderabad',
            engineerId: manager.id,
            isActive: true
          }
        });
      }
    }

    console.log('Successfully updated Internship Project data!');
  } else {
    console.log('Internship project not found.');
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
