import { PrismaClient,            } from '@prisma/client';

const prisma = new PrismaClient();

// Hardcoded hash for 'Admin@123'
const ADMIN_PASSWORD_HASH = '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clean existing records (Optional, if starting fresh)
  // Clean in correct order of dependency
  await prisma.activityLog.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.labourWage.deleteMany({});
  await prisma.labourAttendance.deleteMany({});
  await prisma.projectExpense.deleteMany({});
  await prisma.clientEnquiry.deleteMany({});
  await prisma.paymentMilestone.deleteMany({});
  await prisma.subcontractorTask.deleteMany({});
  await prisma.equipmentMachinery.deleteMany({});
  await prisma.siteProgress.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.wastageRecord.deleteMany({});
  await prisma.materialUsage.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.materialCategory.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables');

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@constco.com',
      password: ADMIN_PASSWORD_HASH,
      role: "admin",
      phone: '9876543210',
    },
  });

  const pm = await prisma.user.create({
    data: {
      name: 'Raj Kumar',
      email: 'pm@constco.com',
      password: ADMIN_PASSWORD_HASH,
      role: "project_manager",
      phone: '9876543211',
    },
  });

  const engineer = await prisma.user.create({
    data: {
      name: 'Amit Singh',
      email: 'engineer@constco.com',
      password: ADMIN_PASSWORD_HASH,
      role: "site_engineer",
      phone: '9876543212',
    },
  });

  const procurement = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'procurement@constco.com',
      password: ADMIN_PASSWORD_HASH,
      role: "procurement_staff",
      phone: '9876543213',
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Sanjay Mehta',
      email: 'accounts@constco.com',
      password: ADMIN_PASSWORD_HASH,
      role: "accounts_staff",
      phone: '9876543214',
    },
  });

  const storeKeeper = await prisma.user.create({
    data: {
      name: 'Ramesh Patel',
      email: 'storekeeper@constco.com',
      password: ADMIN_PASSWORD_HASH,
      role: "store_keeper",
      phone: '9876543215',
    },
  });

  console.log('👥 Users seeded');

  // 3. Create Material Categories
  const categoriesData = [
    { name: 'Cement & Concrete', description: 'Binding materials', color: '#78716C' },
    { name: 'Steel & Metal', description: 'Structural metals', color: '#6B7280' },
    { name: 'Bricks & Masonry', description: 'Wall construction', color: '#B45309' },
    { name: 'Sand & Aggregates', description: 'Fine and coarse aggregates', color: '#D97706' },
    { name: 'Tiles & Flooring', description: 'Floor and wall finishes', color: '#0891B2' },
    { name: 'Pipes & Plumbing', description: 'Water and drainage', color: '#0284C7' },
    { name: 'Electrical', description: 'Electrical components', color: '#7C3AED' },
    { name: 'Wood & Timber', description: 'Wooden materials', color: '#92400E' },
    { name: 'Paint & Chemicals', description: 'Surface treatment', color: '#059669' },
    { name: 'Safety Equipment', description: 'PPE and safety', color: '#DC2626' },
  ];

  const categoriesMap: { [key: string]: any } = {};
  for (const cat of categoriesData) {
    const created = await prisma.materialCategory.create({ data: cat });
    categoriesMap[cat.name] = created;
  }
  console.log('🗂️ Categories seeded');

  // 4. Create Suppliers
  const suppliersData = [
    { supplierCode: 'SUP-001', name: 'BuildMat Supplies Pvt Ltd', contactPerson: 'Rakesh Gupta', email: 'rakesh@buildmat.com', phone: '9811234567', address: '12 Industrial Area, Sector 5', city: 'Delhi', state: 'Delhi', gstNumber: '07AABCB1234A1Z1', paymentTerms: 'Net 30', creditLimit: 500000, isActive: true, rating: 4.5 },
    { supplierCode: 'SUP-002', name: 'Steel Works India', contactPerson: 'Vikram Joshi', email: 'vikram@steelworks.in', phone: '9822345678', address: '45 Metal Park, Bhosari', city: 'Pune', state: 'Maharashtra', gstNumber: '27AABCS5678B2Z2', paymentTerms: 'Net 45', creditLimit: 2000000, isActive: true, rating: 4.8 },
    { supplierCode: 'SUP-003', name: 'Cement Traders Co', contactPerson: 'Meena Patel', email: 'meena@cementtrade.com', phone: '9833456789', address: '78 Traders Hub, GIDC', city: 'Ahmedabad', state: 'Gujarat', gstNumber: '24AABCC9012C3Z3', paymentTerms: 'Net 30', creditLimit: 1000000, isActive: true, rating: 4.2 },
    { supplierCode: 'SUP-004', name: 'Pipe Masters Ltd', contactPerson: 'Anand Rao', email: 'anand@pipemasters.com', phone: '9844567890', address: '23 Plumbing Zone', city: 'Bangalore', state: 'Karnataka', gstNumber: '29AABCP3456D4Z4', paymentTerms: 'Net 60', creditLimit: 800000, isActive: true, rating: 4.0 },
    { supplierCode: 'SUP-005', name: 'Electro Supplies', contactPerson: 'Sunita Verma', email: 'sunita@electro.com', phone: '9855678901', address: '56 Electronics Hub, Ambattur', city: 'Chennai', state: 'Tamil Nadu', gstNumber: '33AABCE7890E5Z5', paymentTerms: 'Net 30', creditLimit: 400000, isActive: true, rating: 4.6 },
  ];

  const suppliersList = [];
  for (const sup of suppliersData) {
    const created = await prisma.supplier.create({ data: sup });
    suppliersList.push(created);
  }
  console.log('🏭 Suppliers seeded');

  // 5. Create Projects
  const projectsData = [
    { projectCode: 'PRJ-A1B2C3', name: 'Greenfield Residential Complex', description: '200-unit residential complex G+12 floors', location: 'Sector 45, Noida', clientName: 'Greenfield Developers', startDate: new Date('2024-01-15'), endDate: new Date('2025-12-31'), budget: 25000000.00, status: "active", managerId: pm.id, createdBy: admin.id },
    { projectCode: 'PRJ-D4E5F6', name: 'City Mall Construction', description: 'Commercial shopping mall', location: 'MG Road, Bangalore', clientName: 'City Realty Ltd', startDate: new Date('2024-03-01'), endDate: new Date('2026-03-31'), budget: 45000000.00, status: "active", managerId: pm.id, createdBy: admin.id },
    { projectCode: 'PRJ-G7H8I9', name: 'Industrial Warehouse Block A', description: 'Logistics warehouse complex', location: 'MIDC, Pune', clientName: 'LogiPark Pvt Ltd', startDate: new Date('2023-06-01'), endDate: new Date('2024-11-30'), budget: 12000000.00, status: "completed", managerId: pm.id, createdBy: admin.id },
    { projectCode: 'PRJ-J1K2L3', name: 'Highway Bridge Repair', description: 'Structural repair and strengthening', location: 'NH-48, Km 234', clientName: 'NHAI', startDate: new Date('2024-07-01'), endDate: new Date('2025-01-31'), budget: 8000000.00, status: "active", managerId: pm.id, createdBy: admin.id },
  ];

  const projectsList = [];
  for (const prj of projectsData) {
    const created = await prisma.project.create({ data: prj });
    projectsList.push(created);
  }
  console.log('🏗️ Projects seeded');

  // 6. Create Sites
  const sitesData = [
    { siteCode: 'SITE-M4N5O6', name: 'Greenfield Block A', location: 'Sector 45, Noida', address: 'Plot 12, Sector 45, Noida - 201301', projectId: projectsList[0].id, engineerId: engineer.id },
    { siteCode: 'SITE-P7Q8R9', name: 'Greenfield Block B', location: 'Sector 45, Noida', address: 'Plot 13, Sector 45, Noida - 201301', projectId: projectsList[0].id, engineerId: engineer.id },
    { siteCode: 'SITE-S1T2U3', name: 'City Mall Main Site', location: 'MG Road, Bangalore', address: 'Survey No. 234, MG Road, Bangalore - 560001', projectId: projectsList[1].id, engineerId: engineer.id },
    { siteCode: 'SITE-V4W5X6', name: 'Warehouse Site Pune', location: 'MIDC, Pune', address: 'MIDC Phase II, Bhosari, Pune - 411026', projectId: projectsList[2].id, engineerId: engineer.id },
    { siteCode: 'SITE-Y7Z8A9', name: 'NH48 Bridge Site', location: 'NH-48 Km 234', address: 'National Highway 48, Km 234, Gurugram', projectId: projectsList[3].id, engineerId: engineer.id },
  ];

  const sitesList = [];
  for (const site of sitesData) {
    const created = await prisma.site.create({ data: site });
    sitesList.push(created);
  }
  console.log('📍 Sites seeded');

  // 7. Create Materials
  const materialsData = [
    { materialCode: 'MAT-C1D2E3', name: 'OPC 53 Grade Cement', categoryId: categoriesMap['Cement & Concrete'].id, unit: 'Bags (50kg)', description: 'Ordinary Portland Cement 53 grade', costPerUnit: 380.00, minimumThreshold: 500, reorderQuantity: 2000, supplierId: suppliersList[2].id },
    { materialCode: 'MAT-F4G5H6', name: 'TMT Steel Bars Fe500', categoryId: categoriesMap['Steel & Metal'].id, unit: 'Metric Ton', description: 'High strength TMT reinforcement bars 8-32mm', costPerUnit: 62000.00, minimumThreshold: 10, reorderQuantity: 50, supplierId: suppliersList[1].id },
    { materialCode: 'MAT-I7J8K9', name: 'Red Clay Bricks', categoryId: categoriesMap['Bricks & Masonry'].id, unit: '1000 nos', description: 'Standard red clay bricks 230x115x75mm', costPerUnit: 7500.00, minimumThreshold: 50, reorderQuantity: 200, supplierId: suppliersList[0].id },
    { materialCode: 'MAT-L1M2N3', name: 'River Sand (Fine)', categoryId: categoriesMap['Sand & Aggregates'].id, unit: 'Cubic Meter', description: 'Clean river sand for plastering & concreting', costPerUnit: 1800.00, minimumThreshold: 20, reorderQuantity: 100, supplierId: suppliersList[0].id },
    { materialCode: 'MAT-O4P5Q6', name: 'Crushed Stone 20mm', categoryId: categoriesMap['Sand & Aggregates'].id, unit: 'Cubic Meter', description: 'Machine crushed stone aggregate 20mm', costPerUnit: 1600.00, minimumThreshold: 15, reorderQuantity: 80, supplierId: suppliersList[0].id },
    { materialCode: 'MAT-R7S8T9', name: 'Vitrified Floor Tiles 600x600', categoryId: categoriesMap['Tiles & Flooring'].id, unit: 'Sq Meter', description: 'Premium vitrified tiles 600x600mm white gloss', costPerUnit: 480.00, minimumThreshold: 200, reorderQuantity: 1000, supplierId: suppliersList[0].id },
    { materialCode: 'MAT-U1V2W3', name: 'CPVC Pipe 25mm', categoryId: categoriesMap['Pipes & Plumbing'].id, unit: 'Meters', description: 'CPVC hot & cold water pipes 25mm dia', costPerUnit: 120.00, minimumThreshold: 500, reorderQuantity: 2000, supplierId: suppliersList[3].id },
    { materialCode: 'MAT-X4Y5Z6', name: 'PVC Electrical Conduit 25mm', categoryId: categoriesMap['Electrical'].id, unit: 'Meters', description: 'Rigid PVC conduit for wiring', costPerUnit: 45.00, minimumThreshold: 1000, reorderQuantity: 5000, supplierId: suppliersList[4].id },
    { materialCode: 'MAT-A7B8C9', name: 'Electrical Copper Wire 2.5sqmm', categoryId: categoriesMap['Electrical'].id, unit: 'Meters', description: 'Flexible copper conductor 2.5 sqmm FR', costPerUnit: 35.00, minimumThreshold: 2000, reorderQuantity: 8000, supplierId: suppliersList[4].id },
    { materialCode: 'MAT-D1E2F3', name: 'ACC Hollow Blocks 200mm', categoryId: categoriesMap['Bricks & Masonry'].id, unit: '1000 nos', description: 'Autoclaved Aerated Concrete hollow blocks', costPerUnit: 9500.00, minimumThreshold: 20, reorderQuantity: 100, supplierId: suppliersList[0].id },
    { materialCode: 'MAT-G4H5I6', name: 'Plywood 18mm BWR', categoryId: categoriesMap['Wood & Timber'].id, unit: 'Sheets', description: '18mm BWR grade plywood 8x4 ft', costPerUnit: 1800.00, minimumThreshold: 50, reorderQuantity: 200, supplierId: suppliersList[0].id },
    { materialCode: 'MAT-J7K8L9', name: 'Waterproof Paint (Exterior)', categoryId: categoriesMap['Paint & Chemicals'].id, unit: 'Liters', description: 'Premium weather proof exterior emulsion paint', costPerUnit: 220.00, minimumThreshold: 100, reorderQuantity: 500, supplierId: suppliersList[0].id },
  ];

  const materialsList = [];
  for (const mat of materialsData) {
    const created = await prisma.material.create({ data: mat });
    materialsList.push(created);
  }
  console.log('🧱 Materials seeded');

  // 8. Create Inventory Records
  const inventoryStockData = [
    { materialIndex: 0, siteIndex: 0, stock: 1200 },
    { materialIndex: 1, siteIndex: 0, stock: 25.5 },
    { materialIndex: 2, siteIndex: 0, stock: 150 },
    { materialIndex: 3, siteIndex: 0, stock: 45 },
    { materialIndex: 4, siteIndex: 0, stock: 30 },
    { materialIndex: 5, siteIndex: 0, stock: 800 },
    { materialIndex: 6, siteIndex: 0, stock: 1500 },
    { materialIndex: 7, siteIndex: 0, stock: 3000 },
    { materialIndex: 8, siteIndex: 0, stock: 4500 },
    { materialIndex: 9, siteIndex: 0, stock: 80 },
    
    { materialIndex: 0, siteIndex: 1, stock: 800 },
    { materialIndex: 1, siteIndex: 1, stock: 18 },
    { materialIndex: 2, siteIndex: 1, stock: 80 },
    { materialIndex: 3, siteIndex: 1, stock: 12 },
    { materialIndex: 4, siteIndex: 1, stock: 8 },
    
    { materialIndex: 0, siteIndex: 2, stock: 600 },
    { materialIndex: 1, siteIndex: 2, stock: 30 },
    { materialIndex: 2, siteIndex: 2, stock: 200 },
    { materialIndex: 3, siteIndex: 2, stock: 25 },
    { materialIndex: 6, siteIndex: 2, stock: 800 },
    
    { materialIndex: 0, siteIndex: 3, stock: 2000 },
    { materialIndex: 1, siteIndex: 3, stock: 45 },
    { materialIndex: 2, siteIndex: 3, stock: 300 },
    { materialIndex: 7, siteIndex: 3, stock: 5000 },
    { materialIndex: 8, siteIndex: 3, stock: 8000 }
  ];

  const inventoryMap: { [key: string]: any } = {};
  for (const inv of inventoryStockData) {
    const mat = materialsList[inv.materialIndex];
    const site = sitesList[inv.siteIndex];
    const created = await prisma.inventory.create({
      data: {
        materialId: mat.id,
        siteId: site.id,
        currentStock: inv.stock,
      }
    });
    inventoryMap[`${mat.id}-${site.id}`] = created;
  }
  console.log('📦 Inventory stocks seeded');

  // 9. Seeding Inventory Transactions, Material Usage, Wastage
  const pastDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  // Pre-seed some stock ledger records
  for (const inv of inventoryStockData) {
    const mat = materialsList[inv.materialIndex];
    const site = sitesList[inv.siteIndex];
    const invRecord = inventoryMap[`${mat.id}-${site.id}`];
    
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: invRecord.id,
        materialId: mat.id,
        siteId: site.id,
        transactionType: "adjustment",
        quantity: inv.stock,
        balanceAfter: inv.stock,
        unitCost: mat.costPerUnit,
        totalCost: Number(mat.costPerUnit) * inv.stock,
        notes: 'Initial inventory seeding adjustment',
        createdBy: admin.id
      }
    });
  }

  // Create Usage Records
  const usagesData = [
    { usageCode: 'USE-001001', siteIndex: 0, materialIndex: 0, quantity: 120, date: pastDays(5), purpose: 'Foundation concrete mix' },
    { usageCode: 'USE-001002', siteIndex: 0, materialIndex: 1, quantity: 3.5, date: pastDays(4), purpose: 'Column reinforcement' },
    { usageCode: 'USE-001003', siteIndex: 0, materialIndex: 2, quantity: 25, date: pastDays(3), purpose: 'Brick masonry wall' },
    { usageCode: 'USE-001004', siteIndex: 1, materialIndex: 0, quantity: 80, date: pastDays(6), purpose: 'Slab casting' },
    { usageCode: 'USE-001005', siteIndex: 2, materialIndex: 6, quantity: 200, date: pastDays(2), purpose: 'Plumbing installation' },
  ];

  for (const use of usagesData) {
    const mat = materialsList[use.materialIndex];
    const site = sitesList[use.siteIndex];
    const unitCost = mat.costPerUnit;
    const totalCost = Number(unitCost) * use.quantity;

    await prisma.materialUsage.create({
      data: {
        usageCode: use.usageCode,
        siteId: site.id,
        materialId: mat.id,
        quantityUsed: use.quantity,
        unitCost,
        totalCost,
        usageDate: use.date,
        purpose: use.purpose,
        recordedBy: engineer.id
      }
    });

    // Update inventory stock
    const invKey = `${mat.id}-${site.id}`;
    const inv = inventoryMap[invKey];
    if (inv) {
      const newStock = Number(inv.currentStock) - use.quantity;
      await prisma.inventory.update({
        where: { id: inv.id },
        data: { currentStock: newStock }
      });

      // Add transaction
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          materialId: mat.id,
          siteId: site.id,
          transactionType: "usage",
          quantity: -use.quantity,
          balanceAfter: newStock,
          unitCost,
          totalCost,
          notes: `Recorded usage: ${use.purpose}`,
          createdBy: engineer.id
        }
      });
    }
  }
  console.log('🛠️ Material usage seeded and stock updated');

  // Create Wastages
  const wastagesData = [
    { wastageCode: 'WST-001001', siteIndex: 0, materialIndex: 0, quantity: 15, date: pastDays(7), reason: "spill", preventable: true },
    { wastageCode: 'WST-001002', siteIndex: 0, materialIndex: 2, quantity: 5, date: pastDays(6), reason: "damage", preventable: false },
    { wastageCode: 'WST-001003', siteIndex: 1, materialIndex: 3, quantity: 2, date: pastDays(3), reason: "cutting_loss", preventable: false }
  ];

  for (const wst of wastagesData) {
    const mat = materialsList[wst.materialIndex];
    const site = sitesList[wst.siteIndex];
    const unitCost = mat.costPerUnit;
    const totalCost = Number(unitCost) * wst.quantity;

    await prisma.wastageRecord.create({
      data: {
        wastageCode: wst.wastageCode,
        siteId: site.id,
        materialId: mat.id,
        quantityWasted: wst.quantity,
        unitCost,
        totalCost,
        wastageDate: wst.date,
        reason: wst.reason,
        preventable: wst.preventable,
        recordedBy: engineer.id
      }
    });

    // Update inventory
    const invKey = `${mat.id}-${site.id}`;
    const inv = inventoryMap[invKey];
    if (inv) {
      const newStock = Number(inv.currentStock) - wst.quantity;
      await prisma.inventory.update({
        where: { id: inv.id },
        data: { currentStock: newStock }
      });

      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          materialId: mat.id,
          siteId: site.id,
          transactionType: "wastage",
          quantity: -wst.quantity,
          balanceAfter: newStock,
          unitCost,
          totalCost,
          notes: `Recorded wastage: ${wst.reason}`,
          createdBy: engineer.id
        }
      });
    }
  }
  console.log('🗑️ Wastage records seeded and stock updated');

  // 10. Seed Purchase Orders
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-001',
      supplierId: suppliersList[2].id, // Cement Traders
      projectId: projectsList[0].id,
      siteId: sitesList[0].id,
      orderDate: pastDays(2),
      expectedDelivery: pastDays(-2),
      subtotal: 190000,
      taxAmount: 34200, // 18%
      totalAmount: 224200,
      status: "approved",
      paymentStatus: "pending",
      createdBy: procurement.id,
      approvedBy: pm.id,
      approvedAt: pastDays(1),
      items: {
        create: [
          {
            materialId: materialsList[0].id, // OPC 53 Grade Cement
            quantity: 500, // 500 Bags
            unitPrice: 380,
            totalPrice: 190000,
            taxPercentage: 18,
          }
        ]
      }
    }
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-002',
      supplierId: suppliersList[1].id, // Steel Works
      projectId: projectsList[1].id,
      siteId: sitesList[2].id,
      orderDate: pastDays(1),
      expectedDelivery: pastDays(-5),
      subtotal: 620000,
      taxAmount: 111600,
      totalAmount: 731600,
      status: "pending_approval",
      paymentStatus: "pending",
      createdBy: procurement.id,
      items: {
        create: [
          {
            materialId: materialsList[1].id, // TMT Steel
            quantity: 10,
            unitPrice: 62000,
            totalPrice: 620000,
            taxPercentage: 18,
          }
        ]
      }
    }
  });

  console.log('💳 Purchase orders seeded');

  // 11. Seed Alerts
  await prisma.alert.create({
    data: {
      type: "low_stock",
      title: 'Low Stock Alert: OPC 53 Grade Cement',
      message: 'OPC 53 Grade Cement at Greenfield Block B is below the minimum threshold of 500 Bags.',
      materialId: materialsList[0].id,
      siteId: sitesList[1].id,
      severity: "high",
    }
  });

  await prisma.alert.create({
    data: {
      type: "po_approval",
      title: 'Purchase Order Approval Pending: PO-2026-002',
      message: 'PO-2026-002 for Steel Works India requires Project Manager approval.',
      poId: po2.id,
      severity: "medium",
    }
  });

  console.log('🚨 Alerts seeded');

  // 12. Seed Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: 'System initialization',
      entityType: 'system',
      entityName: 'Material Inventory System',
      description: 'System completely set up and seeded with construction ERP data.',
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: pm.id,
      userName: pm.name,
      action: 'Create Project',
      entityType: 'project',
      entityId: projectsList[0].id,
      entityName: projectsList[0].name,
      description: `Project ${projectsList[0].name} created by Project Manager.`,
    }
  });

  console.log('📝 Activity logs seeded');

  // 13. Seed Labour Attendance & wages
  const attendance = await prisma.labourAttendance.create({
    data: {
      siteId: sitesList[0].id,
      date: pastDays(1),
      totalWorkers: 35,
      skilledWorkers: 15,
      unskilledWorkers: 20,
      contractorName: 'Apex Construction Labours',
      notes: 'Plastering work in progress on 4th floor.',
      recordedBy: engineer.id,
    }
  });

  await prisma.labourWage.create({
    data: {
      attendanceId: attendance.id,
      amountPaid: 21500.00,
      paymentDate: pastDays(1),
      paymentMethod: 'Bank Transfer',
      remarks: 'Daily wages settled for 35 workers.',
    }
  });

  console.log('👷 Labour details seeded');

  // 14. Seed Project Expenses
  await prisma.projectExpense.create({
    data: {
      projectId: projectsList[0].id,
      category: 'Fuel & Machinery',
      amount: 4500.00,
      expenseDate: pastDays(2),
      description: 'Diesel for JCB excavator',
      incurredBy: 'Amit Singh',
      recordedBy: engineer.id,
    }
  });

  console.log('💸 Project expenses seeded');

  // 15. Seed Client Enquiries
  await prisma.clientEnquiry.create({
    data: {
      clientName: 'Sun Growth Realtors',
      contactInfo: 'realtors@sungrowth.com',
      enquiryDate: pastDays(4),
      details: 'Requirement of a warehousing block layout proposal in Pune.',
      status: "new",
      assignedTo: pm.id,
    }
  });

  console.log('📞 Client enquiries seeded');

  // 16. Seed Payment Milestones
  await prisma.paymentMilestone.create({
    data: {
      projectId: projectsList[0].id,
      milestoneName: 'Foundation completion payment',
      amount: 5000000.00,
      dueDate: pastDays(-30),
      status: "paid",
    }
  });

  console.log('💰 Payment milestones seeded');

  // 17. Seed Subcontractor Tasks
  await prisma.subcontractorTask.create({
    data: {
      projectId: projectsList[0].id,
      subcontractorName: 'SafeVolt Electricals',
      taskDescription: 'Conduit laying and electrical wiring for floors 1 to 5',
      startDate: pastDays(10),
      endDate: pastDays(-20),
      status: "in_progress",
      cost: 120000.00,
    }
  });

  console.log('🔨 Subcontractor tasks seeded');

  // 18. Seed Equipment Machinery
  await prisma.equipmentMachinery.create({
    data: {
      siteId: sitesList[0].id,
      equipmentName: 'Tower Crane TC-240',
      model: 'Liebherr 85 EC-B',
      status: "active",
      assignedDate: pastDays(15),
      notes: 'Certified fit for operation. Next service due in 3 months.',
    }
  });

  console.log('⚙️ Equipment machinery seeded');

  // 19. Seed Site Progress
  await prisma.siteProgress.create({
    data: {
      siteId: sitesList[0].id,
      reportDate: pastDays(1),
      progressPercentage: 42.5,
      workCompleted: 'Foundation complete. Pillar columns casting completed for Ground, 1st and 2nd floor.',
      issuesFaced: 'Minor sand delivery delays due to rain.',
      reportedBy: engineer.id,
    }
  });

  console.log('📈 Site progress seeded');

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
