import { prisma } from '../config/database';

export interface AIInsightsResponse {
  summary: {
    totalMaterials: number;
    totalSites: number;
    totalInventoryValue: number;
    lowStockMaterialsCount: number;
    activeProjectsCount: number;
  };
  shortagePredictions: Array<{
    materialId: number;
    materialName: string;
    siteId: number;
    siteName: string;
    currentStock: number;
    minimumThreshold: number;
    severity: 'critical' | 'high' | 'medium';
    status: string;
  }>;
  purchaseSuggestions: Array<{
    materialId: number;
    materialName: string;
    suggestedQty: number;
    supplierId: number | null;
    supplierName: string;
    estimatedCost: number;
    reason: string;
  }>;
  materialForecast: Array<{
    materialName: string;
    averageDailyUsage: number;
    currentTotalStock: number;
    daysRemaining: number;
    outlook: string;
  }>;
  stockRecommendations: Array<{
    materialId: number;
    materialName: string;
    fromSiteId: number;
    fromSiteName: string;
    fromSiteStock: number;
    toSiteId: number;
    toSiteName: string;
    toSiteStock: number;
    recommendedTransferQty: number;
    reason: string;
  }>;
  projectSummaries: Array<{
    projectId: number;
    projectName: string;
    budget: number;
    totalExpenses: number;
    budgetUtilization: number;
    siteCount: number;
    status: string;
  }>;
  timestamp: Date;
}

export const generateInsights = async (data?: any): Promise<AIInsightsResponse> => {
  // Fetch real data to construct analytics
  const materials = await prisma.material.findMany({
    include: {
      category: true,
      supplier: true,
      inventory: {
        include: { site: true }
      }
    }
  });

  const sites = await prisma.site.findMany({
    where: { isActive: true }
  });

  const projects = await prisma.project.findMany({
    include: {
      sites: true,
      expenses: true
    }
  });

  const usages = await prisma.materialUsage.findMany({
    where: {
      usageDate: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // last 30 days
      }
    },
    include: { material: true }
  });

  const expenses = await prisma.projectExpense.findMany();

  // 1. Calculate Summary Stats
  const totalMaterials = materials.length;
  const totalSites = sites.length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;

  let totalInventoryValue = 0;
  let lowStockMaterialsCount = 0;

  const shortagePredictions: AIInsightsResponse['shortagePredictions'] = [];
  const purchaseSuggestions: AIInsightsResponse['purchaseSuggestions'] = [];
  const stockRecommendations: AIInsightsResponse['stockRecommendations'] = [];

  // Track site-wise stock for recommendations
  // MaterialId -> Array of {siteId, siteName, stock}
  const stockLocationMap: { [key: number]: Array<{ siteId: number; siteName: string; stock: number }> } = {};

  for (const mat of materials) {
    const cost = Number(mat.costPerUnit) || 0;
    const minThreshold = Number(mat.minimumThreshold) || 0;
    const reorderQty = Number(mat.reorderQuantity) || minThreshold * 2 || 100;
    
    let materialTotalStock = 0;
    stockLocationMap[mat.id] = [];

    for (const inv of mat.inventory) {
      const stockVal = Number(inv.currentStock) || 0;
      materialTotalStock += stockVal;
      totalInventoryValue += stockVal * cost;
      
      stockLocationMap[mat.id].push({
        siteId: inv.siteId,
        siteName: inv.site.name,
        stock: stockVal
      });

      // Detect shortages site-wise
      if (stockVal < minThreshold) {
        const severity = stockVal === 0 ? 'critical' : (stockVal < minThreshold * 0.4 ? 'high' : 'medium');
        shortagePredictions.push({
          materialId: mat.id,
          materialName: mat.name,
          siteId: inv.siteId,
          siteName: inv.site.name,
          currentStock: stockVal,
          minimumThreshold: minThreshold,
          severity,
          status: stockVal === 0 ? 'Out of Stock' : 'Below Safe Threshold'
        });
      }
    }

    // If total stock is low, suggest purchasing
    if (materialTotalStock < minThreshold * mat.inventory.length) {
      lowStockMaterialsCount++;
      const suggestedQty = reorderQty;
      const supplierName = mat.supplier?.name || 'Preferred Supplier (Unassigned)';
      
      purchaseSuggestions.push({
        materialId: mat.id,
        materialName: mat.name,
        suggestedQty,
        supplierId: mat.supplierId,
        supplierName,
        estimatedCost: suggestedQty * cost,
        reason: `Total stock (${materialTotalStock} ${mat.unit}) is below the recommended threshold of ${minThreshold * (mat.inventory.length || 1)} across all sites.`
      });
    }
  }

  // 2. Compute Material Forecasts (last 30 days usage)
  const materialForecast: AIInsightsResponse['materialForecast'] = [];
  const usageTotals: { [key: string]: { sum: number; matName: string; unit: string } } = {};
  
  for (const usage of usages) {
    const qty = Number(usage.quantityUsed) || 0;
    if (!usageTotals[usage.materialId]) {
      usageTotals[usage.materialId] = { sum: 0, matName: usage.material.name, unit: usage.material.unit };
    }
    usageTotals[usage.materialId].sum += qty;
  }

  for (const mat of materials) {
    const usageData = usageTotals[mat.id];
    const totalStock = mat.inventory.reduce((sum, inv) => sum + (Number(inv.currentStock) || 0), 0);
    const avgDaily = usageData ? usageData.sum / 30 : 0;
    
    let daysRemaining = 999;
    let outlook = 'Stable';
    
    if (avgDaily > 0) {
      daysRemaining = Math.round(totalStock / avgDaily);
      if (daysRemaining < 7) {
        outlook = 'Critical Shortage Risk';
      } else if (daysRemaining < 30) {
        outlook = 'Reorder Required Soon';
      }
    } else {
      outlook = 'No recent consumption';
    }

    if (avgDaily > 0 || totalStock < Number(mat.minimumThreshold)) {
      materialForecast.push({
        materialName: mat.name,
        averageDailyUsage: Math.round(avgDaily * 100) / 100,
        currentTotalStock: totalStock,
        daysRemaining: daysRemaining > 365 ? 365 : daysRemaining,
        outlook
      });
    }
  }

  // 3. Stock Transfer Recommendations
  for (const mat of materials) {
    const locations = stockLocationMap[mat.id] || [];
    if (locations.length < 2) continue;

    // Find sites with excess stock vs sites with low stock
    const minThreshold = Number(mat.minimumThreshold) || 0;
    const excessSites = locations.filter(loc => loc.stock > minThreshold * 2.5);
    const deficientSites = locations.filter(loc => loc.stock < minThreshold);

    if (excessSites.length > 0 && deficientSites.length > 0) {
      const source = excessSites.sort((a, b) => b.stock - a.stock)[0];
      const target = deficientSites.sort((a, b) => a.stock - b.stock)[0];
      const transferQty = Math.round((source.stock - minThreshold * 1.5) * 0.5);

      if (transferQty > 5) {
        stockRecommendations.push({
          materialId: mat.id,
          materialName: mat.name,
          fromSiteId: source.siteId,
          fromSiteName: source.siteName,
          fromSiteStock: source.stock,
          toSiteId: target.siteId,
          toSiteName: target.siteName,
          toSiteStock: target.stock,
          recommendedTransferQty: transferQty,
          reason: `Transfer surplus stock of ${transferQty} ${mat.unit} from ${source.siteName} (surplus of ${source.stock}) to resolve shortage at ${target.siteName} (current stock is ${target.stock}, threshold is ${minThreshold}).`
        });
      }
    }
  }

  // 4. Project Summaries
  const projectSummaries: AIInsightsResponse['projectSummaries'] = [];
  for (const prj of projects) {
    const budget = Number(prj.budget) || 0;
    // Sum project expenses
    const prjExpenses = prj.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const utilization = budget > 0 ? (prjExpenses / budget) * 100 : 0;

    projectSummaries.push({
      projectId: prj.id,
      projectName: prj.name,
      budget,
      totalExpenses: prjExpenses,
      budgetUtilization: Math.round(utilization * 100) / 100,
      siteCount: prj.sites.length,
      status: prj.status
    });
  }

  return {
    summary: {
      totalMaterials,
      totalSites,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      lowStockMaterialsCount,
      activeProjectsCount
    },
    shortagePredictions: shortagePredictions.slice(0, 5),
    purchaseSuggestions: purchaseSuggestions.slice(0, 5),
    materialForecast: materialForecast.slice(0, 5),
    stockRecommendations: stockRecommendations.slice(0, 5),
    projectSummaries,
    timestamp: new Date()
  };
};
