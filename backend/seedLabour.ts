import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding more Labour Attendance records...');

  const engineer = await prisma.user.findFirst({ where: { role: 'site_engineer' } });
  const sites = await prisma.site.findMany();

  if (!engineer || sites.length === 0) {
    console.log('Missing prerequisite data');
    return;
  }

  const labourData = [
    {
      siteId: sites[0].id,
      date: new Date('2026-06-24'),
      skilledWorkers: 10,
      unskilledWorkers: 25,
      totalWorkers: 35,
      contractorName: 'ABC Construction',
      notes: 'Foundation work in progress',
      recordedBy: engineer.id
    },
    {
      siteId: sites.length > 1 ? sites[1].id : sites[0].id,
      date: new Date('2026-06-23'),
      skilledWorkers: 15,
      unskilledWorkers: 40,
      totalWorkers: 55,
      contractorName: 'XYZ Manpower',
      notes: 'Slab reinforcement',
      recordedBy: engineer.id
    },
    {
      siteId: sites[0].id,
      date: new Date('2026-06-22'),
      skilledWorkers: 5,
      unskilledWorkers: 15,
      totalWorkers: 20,
      contractorName: 'Metro Builders',
      notes: 'Brick masonry work',
      recordedBy: engineer.id
    },
    {
      siteId: sites.length > 1 ? sites[1].id : sites[0].id,
      date: new Date('2026-06-21'),
      skilledWorkers: 8,
      unskilledWorkers: 30,
      totalWorkers: 38,
      contractorName: 'ABC Construction',
      notes: 'Site cleaning and material shifting',
      recordedBy: engineer.id
    }
  ];

  for (const l of labourData) {
    await prisma.labourAttendance.create({ data: l });
  }

  console.log('Successfully added more Labour Attendance records!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
