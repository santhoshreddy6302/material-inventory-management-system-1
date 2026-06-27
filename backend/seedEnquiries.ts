import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding more Enquiries...');

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });

  if (!admin) {
    console.log('Missing admin data');
    return;
  }

  const enquiriesData = [
    {
      clientName: 'NHAI Highway Authority',
      contactInfo: 'nhai@govt.in',
      details: 'Requesting a quote for 500 MT of cement for the upcoming highway expansion project.',
      status: 'pending',
      assignedTo: admin.id,
      enquiryDate: new Date('2026-06-25'),
    },
    {
      clientName: 'LogiPark Pvt Ltd',
      contactInfo: 'admin@logipark.com',
      details: 'Issue with the flooring material supplied last week. Needs immediate inspection.',
      status: 'resolved',
      assignedTo: admin.id,
      enquiryDate: new Date('2026-06-20'),
    },
    {
      clientName: 'City Realty Ltd',
      contactInfo: 'projects@cityrealty.com',
      details: 'Looking for a contractor to handle the entire HVAC system for the mall. Please provide estimate.',
      status: 'pending',
      assignedTo: admin.id,
      enquiryDate: new Date('2026-06-24'),
    },
    {
      clientName: 'Greenfield Developers',
      contactInfo: 'greenfield@dev.com',
      details: 'When will the structural steel delivery be completed for Block B? We are running behind schedule.',
      status: 'resolved',
      assignedTo: admin.id,
      enquiryDate: new Date('2026-06-22'),
    }
  ];

  for (const enq of enquiriesData) {
    await prisma.clientEnquiry.create({ data: enq });
  }

  console.log('Successfully added more Client Enquiries!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
