import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, error } from '../utils/responseHelper';

export const getStats = async (req: Request, res: Response) => {
  try {
    const materials = await prisma.material.count({ where: { isActive: true } });
    const projects = await prisma.project.count({ where: { status: 'active' } });
    const suppliers = await prisma.supplier.count({ where: { isActive: true } });
    const sites = await prisma.site.count({ where: { isActive: true } });
    
    // Low stock
    const allInventory = await prisma.inventory.findMany({
      include: { material: true }
    });
    
    const matStock = new Map<number, number>();
    allInventory.forEach(inv => {
      const current = Number(inv.currentStock);
      matStock.set(inv.materialId, (matStock.get(inv.materialId) || 0) + current);
    });
    
    let lowStockCount = 0;
    const allMats = await prisma.material.findMany({ where: { isActive: true } });
    allMats.forEach(m => {
      if ((matStock.get(m.id) || 0) <= Number(m.minimumThreshold)) {
        lowStockCount++;
      }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyPurchases = await prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: ['draft', 'cancelled'] }, orderDate: { gte: startOfMonth } }
    });
    
    const monthlyUsage = await prisma.materialUsage.aggregate({
      _sum: { totalCost: true },
      where: { usageDate: { gte: startOfMonth } }
    });
    
    const monthlyWastage = await prisma.wastageRecord.aggregate({
      _sum: { totalCost: true },
      where: { wastageDate: { gte: startOfMonth } }
    });
    
    const pendingPOs = await prisma.purchaseOrder.count({
      where: { status: { in: ['pending_approval', 'approved', 'ordered'] } }
    });
    
    const unreadAlerts = await prisma.alert.count({
      where: { isRead: false, isResolved: false }
    });

    return success(res, {
      totalMaterials: materials,
      activeProjects: projects,
      totalSuppliers: suppliers,
      activeSites: sites,
      lowStockMaterials: lowStockCount,
      monthlyPurchases: Number(monthlyPurchases._sum.totalAmount || 0),
      monthlyUsageCost: Number(monthlyUsage._sum.totalCost || 0),
      monthlyWastageCost: Number(monthlyWastage._sum.totalCost || 0),
      pendingPOs,
      unreadAlerts
    });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getInventoryTrend = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, transactionType: true, quantity: true }
    });
    
    const grouped: Record<string, any> = {};
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = { date, purchases: 0, usage: 0, wastage: 0 };
      
      const qty = Math.abs(Number(t.quantity));
      if (t.transactionType === 'purchase') grouped[date].purchases += qty;
      else if (t.transactionType === 'usage') grouped[date].usage += qty;
      else if (t.transactionType === 'wastage') grouped[date].wastage += qty;
    });
    
    const rows = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getUsageByCategory = async (req: Request, res: Response) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const usages = await prisma.materialUsage.findMany({
      where: { usageDate: { gte: startOfMonth } },
      include: { material: { include: { category: true } } }
    });
    
    const grouped: Record<string, any> = {};
    usages.forEach(u => {
      const catName = u.material?.category?.name || 'Uncategorized';
      if (!grouped[catName]) grouped[catName] = { category: catName, total_cost: 0, total_qty: 0 };
      grouped[catName].total_cost += Number(u.totalCost || 0);
      grouped[catName].total_qty += Number(u.quantityUsed || 0);
    });
    
    const rows = Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost);
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getWastageAnalysis = async (req: Request, res: Response) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const wastages = await prisma.wastageRecord.findMany({
      where: { wastageDate: { gte: sixMonthsAgo } }
    });
    
    const grouped: Record<string, any> = {};
    wastages.forEach(w => {
      const reason = w.reason;
      if (!grouped[reason]) grouped[reason] = { reason, count: 0, total_cost: 0 };
      grouped[reason].count++;
      grouped[reason].total_cost += Number(w.totalCost || 0);
    });
    
    const rows = Object.values(grouped).sort((a, b) => b.total_cost - a.total_cost);
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getSiteConsumption = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sites = await prisma.site.findMany({ where: { isActive: true } });
    const usages = await prisma.materialUsage.findMany({ where: { usageDate: { gte: thirtyDaysAgo } } });
    const wastages = await prisma.wastageRecord.findMany({ where: { wastageDate: { gte: thirtyDaysAgo } } });
    
    const rows = sites.map(s => {
      const uCost = usages.filter(u => u.siteId === s.id).reduce((sum, u) => sum + Number(u.totalCost || 0), 0);
      const wCost = wastages.filter(w => w.siteId === s.id).reduce((sum, w) => sum + Number(w.totalCost || 0), 0);
      return { site_name: s.name, usage_cost: uCost, wastage_cost: wCost };
    }).sort((a, b) => b.usage_cost - a.usage_cost).slice(0, 10);
    
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getMonthlyTrend = async (req: Request, res: Response) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { notIn: ['draft', 'cancelled'] }, orderDate: { gte: twelveMonthsAgo } }
    });
    const usages = await prisma.materialUsage.findMany({
      where: { usageDate: { gte: twelveMonthsAgo } }
    });
    
    const groupedP: Record<string, number> = {};
    const groupedU: Record<string, number> = {};
    
    pos.forEach(p => {
      const month = p.orderDate.toISOString().substring(0, 7);
      groupedP[month] = (groupedP[month] || 0) + Number(p.totalAmount);
    });
    
    usages.forEach(u => {
      const month = u.usageDate.toISOString().substring(0, 7);
      groupedU[month] = (groupedU[month] || 0) + Number(u.totalCost || 0);
    });
    
    const purchases = Object.entries(groupedP).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month));
    const usageList = Object.entries(groupedU).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month));
    
    return success(res, { purchases, usage: usageList });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const rows = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true } } }
    });
    
    const formatted = rows.map(r => ({ ...r, user_name: r.user?.name || r.userName }));
    return success(res, formatted);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getLowStockItems = async (req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        material: { include: { category: true } },
        site: true
      }
    });
    
    const rows = inventory.filter(i => {
      return i.material.isActive && Number(i.currentStock) <= Number(i.material.minimumThreshold);
    }).map(i => ({
      id: i.material.id,
      name: i.material.name,
      material_code: i.material.materialCode,
      unit: i.material.unit,
      minimum_threshold: Number(i.material.minimumThreshold),
      category_name: i.material.category?.name,
      category_color: i.material.category?.color,
      site_name: i.site.name,
      current_stock: Number(i.currentStock),
      site_id: i.siteId
    })).sort((a, b) => a.current_stock - b.current_stock).slice(0, 20);
    
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
