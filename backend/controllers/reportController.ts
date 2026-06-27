import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, error } from '../utils/responseHelper';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { site_id, format } = req.query;
    
    const where: Prisma.InventoryWhereInput = {};
    if (site_id) where.siteId = parseInt(site_id as string, 10);
    
    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        material: { include: { category: true } },
        site: true
      },
      orderBy: [
        { material: { name: 'asc' } },
        { site: { name: 'asc' } }
      ]
    });

    const rows = inventory.map(i => {
      const currentStock = Number(i.currentStock);
      const minThreshold = Number(i.material?.minimumThreshold || 0);
      const costPerUnit = Number(i.material?.costPerUnit || 0);
      let status = 'In Stock';
      if (currentStock <= 0) status = 'Out of Stock';
      else if (currentStock <= minThreshold) status = 'Low Stock';

      return {
        material_code: i.material?.materialCode,
        material_name: i.material?.name,
        category: i.material?.category?.name,
        unit: i.material?.unit,
        site_name: i.site?.name,
        current_stock: currentStock,
        minimum_threshold: minThreshold,
        cost_per_unit: costPerUnit,
        stock_value: currentStock * costPerUnit,
        status
      };
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.csv');
      const header = 'Code,Material,Category,Unit,Site,Current Stock,Min Threshold,Cost/Unit,Stock Value,Status\n';
      const csvData = rows.map(r => 
        `"${r.material_code}","${r.material_name}","${r.category || ''}","${r.unit}","${r.site_name}",${r.current_stock},${r.minimum_threshold},${r.cost_per_unit},${r.stock_value},"${r.status}"`
      ).join('\n');
      return res.send(header + csvData);
    }

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Inventory Report');
      ws.columns = [
        { header: 'Code', key: 'material_code', width: 15 },
        { header: 'Material', key: 'material_name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Site', key: 'site_name', width: 25 },
        { header: 'Current Stock', key: 'current_stock', width: 15 },
        { header: 'Min Threshold', key: 'minimum_threshold', width: 15 },
        { header: 'Cost/Unit', key: 'cost_per_unit', width: 15 },
        { header: 'Stock Value', key: 'stock_value', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      
      rows.forEach(row => {
        const addedRow = ws.addRow(row);
        if (row.status === 'Out of Stock') addedRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        else if (row.status === 'Low Stock') addedRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.xlsx');
      await wb.xlsx.write(res);
      return res.end();
    }

    const summary = {
      total: rows.length,
      lowStock: rows.filter(r => r.status === 'Low Stock').length,
      outOfStock: rows.filter(r => r.status === 'Out of Stock').length,
      totalValue: rows.reduce((s, r) => s + r.stock_value, 0)
    };
    return success(res, { rows, summary });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getPurchaseReport = async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, supplier_id, format } = req.query;
    
    const where: Prisma.PurchaseOrderWhereInput = {
      status: { notIn: ['draft', 'cancelled'] }
    };
    if (from_date || to_date) {
      where.orderDate = {};
      if (from_date) where.orderDate.gte = new Date(from_date as string);
      if (to_date) where.orderDate.lte = new Date((to_date as string) + 'T23:59:59.999Z');
    }
    if (supplier_id) where.supplierId = parseInt(supplier_id as string, 10);

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true } },
        site: { select: { name: true } }
      },
      orderBy: { orderDate: 'desc' }
    });

    const rows = pos.map(po => ({
      po_number: po.poNumber,
      order_date: po.orderDate.toISOString().split('T')[0],
      supplier_name: po.supplier?.name,
      status: po.status,
      payment_status: po.paymentStatus,
      total_amount: Number(po.totalAmount),
      project_name: po.project?.name,
      site_name: po.site?.name
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=purchase_report.csv');
      const header = 'PO Number,Date,Supplier,Status,Payment,Total,Project,Site\n';
      const csv = rows.map(r => `"${r.po_number}","${r.order_date}","${r.supplier_name}","${r.status}","${r.payment_status}",${r.total_amount},"${r.project_name || ''}","${r.site_name || ''}"`).join('\n');
      return res.send(header + csv);
    }

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Purchase Report');
      ws.columns = [
        { header: 'PO Number', key: 'po_number', width: 20 },
        { header: 'Date', key: 'order_date', width: 15 },
        { header: 'Supplier', key: 'supplier_name', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment', key: 'payment_status', width: 15 },
        { header: 'Total Amount', key: 'total_amount', width: 15 },
        { header: 'Project', key: 'project_name', width: 25 },
        { header: 'Site', key: 'site_name', width: 20 }
      ];
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      rows.forEach(r => ws.addRow(r));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=purchase_report.xlsx');
      await wb.xlsx.write(res);
      return res.end();
    }

    const total = rows.reduce((s, r) => s + r.total_amount, 0);
    return success(res, { rows, summary: { total_orders: rows.length, total_amount: total } });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getUsageReport = async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, site_id, material_id, format } = req.query;
    
    const where: Prisma.MaterialUsageWhereInput = {};
    if (from_date || to_date) {
      where.usageDate = {};
      if (from_date) where.usageDate.gte = new Date(from_date as string);
      if (to_date) where.usageDate.lte = new Date((to_date as string) + 'T23:59:59.999Z');
    }
    if (site_id) where.siteId = parseInt(site_id as string, 10);
    if (material_id) where.materialId = parseInt(material_id as string, 10);

    const usages = await prisma.materialUsage.findMany({
      where,
      include: {
        site: { select: { name: true } },
        material: { select: { name: true, unit: true } },
        recorder: { select: { name: true } }
      },
      orderBy: { usageDate: 'desc' }
    });

    const rows = usages.map(u => ({
      usage_code: u.usageCode,
      usage_date: u.usageDate.toISOString().split('T')[0],
      site_name: u.site?.name,
      material_name: u.material?.name,
      unit: u.material?.unit,
      quantity_used: Number(u.quantityUsed),
      total_cost: Number(u.totalCost),
      purpose: u.purpose,
      recorded_by: u.recorder?.name
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=usage_report.csv');
      const header = 'Code,Date,Site,Material,Unit,Qty Used,Total Cost,Purpose,Recorded By\n';
      const csv = rows.map(r => `"${r.usage_code}","${r.usage_date}","${r.site_name}","${r.material_name}","${r.unit}",${r.quantity_used},${r.total_cost},"${r.purpose || ''}","${r.recorded_by}"`).join('\n');
      return res.send(header + csv);
    }

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Usage Report');
      ws.columns = [
        { header: 'Code', key: 'usage_code', width: 15 },
        { header: 'Date', key: 'usage_date', width: 15 },
        { header: 'Site', key: 'site_name', width: 25 },
        { header: 'Material', key: 'material_name', width: 25 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Qty Used', key: 'quantity_used', width: 12 },
        { header: 'Total Cost', key: 'total_cost', width: 12 },
        { header: 'Purpose', key: 'purpose', width: 20 },
        { header: 'Recorded By', key: 'recorded_by', width: 20 }
      ];
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      rows.forEach(r => ws.addRow(r));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=usage_report.xlsx');
      await wb.xlsx.write(res);
      return res.end();
    }

    const total = rows.reduce((s, r) => s + r.total_cost, 0);
    return success(res, { rows, summary: { total_records: rows.length, total_cost: total } });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getWastageReport = async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, site_id, format } = req.query;
    
    const where: Prisma.WastageRecordWhereInput = {};
    if (from_date || to_date) {
      where.wastageDate = {};
      if (from_date) where.wastageDate.gte = new Date(from_date as string);
      if (to_date) where.wastageDate.lte = new Date((to_date as string) + 'T23:59:59.999Z');
    }
    if (site_id) where.siteId = parseInt(site_id as string, 10);

    const wastages = await prisma.wastageRecord.findMany({
      where,
      include: {
        site: { select: { name: true } },
        material: { select: { name: true, unit: true } },
        recorder: { select: { name: true } }
      },
      orderBy: { wastageDate: 'desc' }
    });

    const rows = wastages.map(w => ({
      wastage_code: w.wastageCode,
      wastage_date: w.wastageDate.toISOString().split('T')[0],
      site_name: w.site?.name,
      material_name: w.material?.name,
      unit: w.material?.unit,
      quantity_wasted: Number(w.quantityWasted),
      total_cost: Number(w.totalCost),
      reason: w.reason,
      preventable: w.preventable,
      recorded_by: w.recorder?.name
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=wastage_report.csv');
      const header = 'Code,Date,Site,Material,Unit,Qty Wasted,Total Cost,Reason,Preventable,Recorded By\n';
      const csv = rows.map(r => `"${r.wastage_code}","${r.wastage_date}","${r.site_name}","${r.material_name}","${r.unit}",${r.quantity_wasted},${r.total_cost},"${r.reason}","${r.preventable ? 'Yes' : 'No'}","${r.recorded_by}"`).join('\n');
      return res.send(header + csv);
    }

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Wastage Report');
      ws.columns = [
        { header: 'Code', key: 'wastage_code', width: 15 },
        { header: 'Date', key: 'wastage_date', width: 15 },
        { header: 'Site', key: 'site_name', width: 25 },
        { header: 'Material', key: 'material_name', width: 25 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Qty Wasted', key: 'quantity_wasted', width: 12 },
        { header: 'Total Cost', key: 'total_cost', width: 12 },
        { header: 'Reason', key: 'reason', width: 15 },
        { header: 'Preventable', key: 'preventable', width: 12 },
        { header: 'Recorded By', key: 'recorded_by', width: 20 }
      ];
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      rows.forEach(r => ws.addRow({ ...r, preventable: r.preventable ? 'Yes' : 'No' }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=wastage_report.xlsx');
      await wb.xlsx.write(res);
      return res.end();
    }

    const total = rows.reduce((s, r) => s + r.total_cost, 0);
    const preventable = rows.filter(r => r.preventable).length;
    return success(res, { rows, summary: { total_records: rows.length, total_cost: total, preventable } });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const total = await prisma.activityLog.count();
    const rows = await prisma.activityLog.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });
    
    const formatted = rows.map(r => ({
      ...r,
      user_name: r.user?.name || r.userName
    }));
    
    return success(res, { rows: formatted, total });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
