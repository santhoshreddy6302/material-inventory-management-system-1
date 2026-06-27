import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell, CheckCircle, RefreshCw, CheckCheck, ShieldAlert, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { alertService } from '../../services/alertService';
import Pagination from '../../components/common/Pagination';
import { fmtDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const SEVERITY_COLORS: Record<string, string> = { 
  critical: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900', 
  high: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900', 
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900', 
  low: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900' 
};

const SEVERITY_ICONS: Record<string, React.ReactNode> = { 
  critical: <ShieldAlert className="h-3 w-3" />, 
  high: <AlertTriangle className="h-3 w-3" />, 
  medium: <AlertCircle className="h-3 w-3" />, 
  low: <Info className="h-3 w-3" /> 
};

const filterSchema = z.object({
  type: z.string().optional(),
  severity: z.string().optional(),
  is_read: z.string().optional(),
  is_resolved: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  material_name?: string;
  site_name?: string;
  po_number?: string;
  created_at: string;
}

export default function AlertsPage() {
  const [data, setData] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      type: 'all',
      severity: 'all',
      is_read: 'all',
      is_resolved: 'false',
    }
  });

  const filters = form.watch();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== 'all' && v !== '')
      );
      const { data: r } = await alertService.getAll({ page, limit: 15, ...activeFilters });
      if (r.success) { 
        setData(r.data); 
        setPagination(r.pagination); 
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters.type, filters.severity, filters.is_read, filters.is_resolved]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleMarkAllRead = async () => {
    try {
      await alertService.markAllRead();
      toast.success('All alerts marked as read');
      fetchData();
    } catch (e: any) { 
      toast.error(e.message || 'Failed to mark read');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertService.resolve(id);
      toast.success('Alert resolved');
      fetchData();
    } catch (e: any) { 
      toast.error(e.message || 'Failed to resolve alert'); 
    }
  };

  const unreadCount = data.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{pagination?.total ?? 0} total alerts matching criteria</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="shadow-sm">
          <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries({ critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }).map(([sev, icon]) => {
          const count = data.filter(a => a.severity === sev && !a.is_resolved).length;
          return (
            <Card key={sev} className={`glass-card bg-background/80 backdrop-blur-xl shadow-sm border-l-4 ${sev === 'critical' ? 'border-l-red-500' : sev === 'high' ? 'border-l-orange-500' : sev === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-sm">{icon}</span> {count}
                </div>
                <div className="text-xs text-muted-foreground capitalize mt-1 font-medium">{sev} priority</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card shadow-sm border-0 bg-background/60 backdrop-blur-xl">
        <div className="p-4 border-b bg-muted/20 flex flex-wrap gap-4 items-end justify-between">
          <Form {...form}>
            <form className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-[160px] bg-background/50">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {['low_stock','out_of_stock','po_approval','delivery_due','budget_exceeded','high_wastage'].map(t => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Severity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-[140px] bg-background/50">
                          <SelectValue placeholder="All Severities" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        {['critical','high','medium','low'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_read"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-[140px] bg-background/50">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="false">Unread</SelectItem>
                        <SelectItem value="true">Read</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_resolved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Resolution</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-[140px] bg-background/50">
                          <SelectValue placeholder="Resolution" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="false">Active</SelectItem>
                        <SelectItem value="true">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading alerts...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No alerts found</TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id} className={!row.is_read ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[row.severity] || 'text-gray-600 bg-gray-50'}`}>
                        {SEVERITY_ICONS[row.severity]} <span className="capitalize">{row.severity}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400">
                        {row.type?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium text-sm ${!row.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {row.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{row.message}</div>
                    </TableCell>
                    <TableCell>
                      {row.material_name ? (
                        <div>
                          <div className="text-sm font-medium">{row.material_name}</div>
                          <div className="text-xs text-muted-foreground">{row.site_name}</div>
                        </div>
                      ) : (
                        row.po_number ? <span className="text-sm font-medium text-primary">PO: {row.po_number}</span> : <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDateTime(row.created_at)}
                    </TableCell>
                    <TableCell>
                      {row.is_read ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Read</Badge> : <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Unread</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {!row.is_resolved ? (
                        <Button variant="ghost" size="sm" onClick={() => handleResolve(row.id)} className="h-8 text-xs hover:bg-green-50 hover:text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" /> Resolve
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
