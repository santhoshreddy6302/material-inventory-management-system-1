import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, FolderKanban, MapPin, Truck, AlertTriangle,
  ShoppingCart, Wrench, Trash2, Clock
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import StatsCard from '../components/dashboard/StatsCard';
import ChartCard from '../components/dashboard/ChartCard';
import { fmtLargeNumber, fmtNumber, timeAgo } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Badge } from '../components/ui/badge';

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#84cc16'];

export default function Dashboard() {
  const [stats, setStats]             = useState<any>(null);
  const [trend, setTrend]             = useState<any[]>([]);
  const [usageCat, setUsageCat]       = useState<any[]>([]);
  const [siteData, setSiteData]       = useState<any[]>([]);
  const [monthlyTrend, setMonthly]    = useState<any>(null);
  const [lowStock, setLowStock]       = useState<any[]>([]);
  const [activity, setActivity]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, t, uc, sc, mt, ls, ac] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getInventoryTrend(),
        dashboardService.getUsageByCategory(),
        dashboardService.getSiteConsumption(),
        dashboardService.getMonthlyTrend(),
        dashboardService.getLowStockItems(),
        dashboardService.getRecentActivity(),
      ]);
      if (s.data.success) setStats(s.data.data);
      if (t.data.success) setTrend(t.data.data);
      if (uc.data.success) setUsageCat(uc.data.data);
      if (sc.data.success) setSiteData(sc.data.data);
      if (mt.data.success) setMonthly(mt.data.data);
      if (ls.data.success) setLowStock(ls.data.data);
      if (ac.data.success) setActivity(ac.data.data);
    } catch {}
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  // Process data for Recharts
  const trendData = trend.map(r => ({
    name: r.date?.slice(5),
    Purchases: r.purchases,
    Usage: r.usage,
    Wastage: r.wastage
  }));

  const usageCatData = usageCat.map(r => ({
    name: r.category || 'Unknown',
    value: parseFloat(r.total_cost || 0)
  }));

  const monthlyLabels = monthlyTrend?.purchases?.map((r: any) => r.month?.slice(0, 7)) || [];
  const monthlyData = monthlyLabels.map((label: string, index: number) => ({
    name: label,
    Purchases: parseFloat(monthlyTrend?.purchases?.[index]?.total || 0),
    Usage: parseFloat(monthlyTrend?.usage?.[index]?.total || 0),
  }));

  const siteChartData = siteData.map(r => ({
    name: r.site_name,
    UsageCost: parseFloat(r.usage_cost || 0),
    WastageCost: parseFloat(r.wastage_cost || 0)
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time insights into your material inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatsCard title="Active Materials"   value={stats?.total_materials ?? '—'}      icon={Package}      color="blue" />
        <StatsCard title="Active Projects"    value={stats?.active_projects ?? '—'}      icon={FolderKanban} color="green" />
        <StatsCard title="Active Sites"       value={stats?.active_sites ?? '—'}         icon={MapPin}       color="purple" />
        <StatsCard title="Suppliers"          value={stats?.total_suppliers ?? '—'}      icon={Truck}        color="orange" />
        <StatsCard
          title="Low Stock Alerts"
          value={stats?.low_stock_materials ?? '—'}
          icon={AlertTriangle}
          color={stats?.low_stock_materials > 0 ? 'red' : 'green'}
          subtitle={stats?.low_stock_materials > 0 ? 'Needs attention' : 'All stocked'}
        />
        <StatsCard title="Monthly Purchases"  value={fmtLargeNumber(stats?.monthly_purchases)}  icon={ShoppingCart} color="blue"   subtitle="This month" />
        <StatsCard title="Monthly Usage"      value={fmtLargeNumber(stats?.monthly_usage_cost)}  icon={Wrench}       color="orange" subtitle="Material cost" />
        <StatsCard title="Monthly Wastage"    value={fmtLargeNumber(stats?.monthly_wastage_cost)}icon={Trash2}       color="red"    subtitle="Loss cost" />
        <StatsCard title="Pending POs"        value={stats?.pending_p_os ?? '—'}          icon={ShoppingCart}  color="yellow" />
        <StatsCard title="Unread Alerts"      value={stats?.unread_alerts ?? '—'}        icon={AlertTriangle} color={stats?.unread_alerts > 0 ? 'red' : 'green'} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="30-Day Stock Movement" subtitle="Purchases vs Usage vs Wastage (qty)" action={
          <Badge variant="secondary" className="text-[10px]">Last 30 days</Badge>
        }>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Usage" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Wastage" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Usage by Category" subtitle="This month's cost breakdown">
          <div className="h-64 w-full flex items-center justify-center mt-4">
            {usageCatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={usageCatData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {usageCatData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => fmtLargeNumber(value)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No usage data this month</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Monthly Trend" subtitle="Purchase vs Usage cost (12 months)">
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => fmtLargeNumber(v)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip formatter={(value: number) => fmtLargeNumber(value)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Purchases" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
                <Area type="monotone" dataKey="Usage" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Site-wise Consumption" subtitle="Last 30 days cost">
          <div className="h-64 w-full mt-4">
            {siteChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={siteChartData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => fmtLargeNumber(v)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                  <RechartsTooltip formatter={(value: number) => fmtLargeNumber(value)} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="UsageCost" name="Usage Cost" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="WastageCost" name="Wastage Cost" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No data available</p>
            )}
          </div>
        </ChartCard>

        {/* Low Stock */}
        <div className="glass-card rounded-xl overflow-hidden border border-border/50">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500"/> Low Stock Alerts</h3>
            <Link to="/inventory" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border/50 bg-background/50">
            {lowStock.length === 0
              ? <div className="py-8 text-center text-sm text-muted-foreground">✅ All materials well-stocked</div>
              : lowStock.slice(0, 5).map(item => (
                <div key={`${item.id}-${item.site_id}`} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{item.name}</span>
                    <div className="text-xs text-muted-foreground mt-1">{item.site_name} · {item.category_name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${item.current_stock <= 0 ? 'text-destructive' : 'text-orange-500'}`}>
                      {fmtNumber(item.current_stock)} {item.unit}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-1">Min: {fmtNumber(item.minimum_threshold)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-xl overflow-hidden border border-border/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Activity Log
          </h3>
        </div>
        <div className="divide-y divide-border/50 bg-background/50">
          {activity.length === 0
            ? <div className="py-8 text-center text-sm text-muted-foreground">No recent activity</div>
            : activity.slice(0, 6).map(a => (
              <div key={a.id} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                  {(a.user_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <span className="text-sm text-foreground font-semibold">{a.user_name || 'System'}</span>
                  <span className="text-sm text-muted-foreground"> — {a.action}</span>
                  {a.entity_name && <span className="text-sm font-medium text-foreground"> "{a.entity_name}"</span>}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground flex-shrink-0 pt-1">{timeAgo(a.created_at)}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
