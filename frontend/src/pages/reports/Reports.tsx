import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileBarChart, Download, Filter } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { downloadBlob, fmtCurrency, fmtDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../components/ui/form';

const REPORT_TYPES = [
  { key: 'inventory', label: 'Inventory Report',   desc: 'Current stock levels across all sites' },
  { key: 'purchase',  label: 'Purchase Report',    desc: 'Purchase orders and supplier spend' },
  { key: 'usage',     label: 'Usage Report',       desc: 'Material consumption by site and date' },
  { key: 'wastage',   label: 'Wastage Report',     desc: 'Wastage records and loss analysis' },
] as const;

type ReportType = typeof REPORT_TYPES[number]['key'];

const filterSchema = z.object({
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  site_id: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportType>('inventory');
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState('');

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      from_date: '2026-06-01',
      to_date: '2026-06-30',
      site_id: '',
    }
  });

  const fetchReport = async (filters: FilterValues) => {
    setLoading(true);
    try {
      const svcMap = { 
        inventory: reportService.getInventory, 
        purchase: reportService.getPurchase, 
        usage: reportService.getUsage, 
        wastage: reportService.getWastage 
      };
      
      const { data: r } = await svcMap[activeTab](filters);
      if (r.success) { 
        setReportData(r.data.rows); 
        setSummary(r.data.summary); 
      }
    } catch (e: any) { 
      toast.error(e.message || 'Failed to fetch report data'); 
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport(form.getValues());
  }, [activeTab]);

  const downloadReport = async (format: string) => {
    setDownloading(format);
    try {
      const filters = form.getValues();
      const res = await reportService.download(activeTab, { ...filters, format });
      downloadBlob(res.data, `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${format}`);
      toast.success(`${format.toUpperCase()} downloaded successfully`);
    } catch (e: any) { 
      toast.error(e.message || 'Report download failed'); 
    }
    setDownloading('');
  };

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setReportData(null);
    setSummary(null);
  };

  const getStatusBadge = (v: string) => {
    switch (v) {
      case 'In Stock': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">{v}</Badge>;
      case 'Low Stock': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">{v}</Badge>;
      case 'Out of Stock': return <Badge variant="destructive">{v}</Badge>;
      default: return <Badge variant="secondary">{v}</Badge>;
    }
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case 'inventory': return (
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Min</TableHead>
          <TableHead>Stock Value</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      );
      case 'purchase': return (
        <TableRow>
          <TableHead>PO No</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Site</TableHead>
        </TableRow>
      );
      case 'usage': return (
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      );
      case 'wastage': return (
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Preventable</TableHead>
        </TableRow>
      );
      default: return null;
    }
  };

  const renderTableRows = () => {
    if (!reportData) return null;
    if (reportData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
            No data found for selected filters.
          </TableCell>
        </TableRow>
      );
    }
    
    return reportData.map((row, idx) => (
      <TableRow key={idx}>
        {activeTab === 'inventory' && (
          <>
            <TableCell className="font-medium">{row.material_code}</TableCell>
            <TableCell>{row.material_name}</TableCell>
            <TableCell>{row.category || '—'}</TableCell>
            <TableCell>{row.unit}</TableCell>
            <TableCell>{row.site_name}</TableCell>
            <TableCell className="font-mono">{row.current_stock}</TableCell>
            <TableCell>{row.minimum_threshold}</TableCell>
            <TableCell>{fmtCurrency(row.stock_value)}</TableCell>
            <TableCell>{getStatusBadge(row.status)}</TableCell>
          </>
        )}
        {activeTab === 'purchase' && (
          <>
            <TableCell className="font-mono text-xs text-primary">{row.po_number}</TableCell>
            <TableCell>{fmtDate(row.order_date)}</TableCell>
            <TableCell>{row.supplier_name}</TableCell>
            <TableCell><Badge variant="secondary" className="capitalize">{row.status?.replace(/_/g, ' ')}</Badge></TableCell>
            <TableCell><Badge variant="outline" className="capitalize">{row.payment_status}</Badge></TableCell>
            <TableCell className="font-semibold">{fmtCurrency(row.total_amount)}</TableCell>
            <TableCell>{row.project_name || '—'}</TableCell>
            <TableCell>{row.site_name || '—'}</TableCell>
          </>
        )}
        {activeTab === 'usage' && (
           <>
            <TableCell className="font-mono text-xs">{row.usage_code}</TableCell>
            <TableCell>{fmtDate(row.usage_date)}</TableCell>
            <TableCell>{row.site_name}</TableCell>
            <TableCell>{row.material_name}</TableCell>
            <TableCell>{`${row.quantity_used} ${row.unit}`}</TableCell>
            <TableCell>{fmtCurrency(row.total_cost)}</TableCell>
            <TableCell>{row.purpose || '—'}</TableCell>
            <TableCell>{row.recorded_by}</TableCell>
          </>
        )}
        {activeTab === 'wastage' && (
           <>
            <TableCell className="font-mono text-xs">{row.wastage_code}</TableCell>
            <TableCell>{fmtDate(row.wastage_date)}</TableCell>
            <TableCell>{row.site_name}</TableCell>
            <TableCell>{row.material_name}</TableCell>
            <TableCell>{`${row.quantity_wasted} ${row.unit}`}</TableCell>
            <TableCell>{fmtCurrency(row.total_cost)}</TableCell>
            <TableCell><Badge className="bg-orange-100 text-orange-800 capitalize hover:bg-orange-100/80">{row.reason?.replace(/_/g, ' ')}</Badge></TableCell>
            <TableCell>{row.preventable ? <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">Yes</Badge> : 'No'}</TableCell>
          </>
        )}
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" /> Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and export inventory reports</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {REPORT_TYPES.map(t => (
          <Button
            key={t.key}
            variant={activeTab === t.key ? "default" : "outline"}
            onClick={() => handleTabChange(t.key)}
            className="rounded-full shadow-sm transition-all"
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card className="glass-card shadow-sm border-0 bg-background/60 backdrop-blur-xl">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(fetchReport)} className="flex flex-wrap gap-4 items-end">
              <FormField
                control={form.control}
                name="from_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">From Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 w-40 text-sm bg-background/50" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">To Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 w-40 text-sm bg-background/50" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="h-9 shadow-sm">
                <Filter className="mr-2 h-4 w-4" /> {loading ? 'Loading…' : 'Generate Report'}
              </Button>
              {reportData && (
                <>
                  <Button type="button" variant="secondary" onClick={() => downloadReport('csv')} disabled={!!downloading} className="h-9 shadow-sm">
                    <Download className="mr-2 h-4 w-4" /> {downloading === 'csv' ? 'Downloading…' : 'CSV'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => downloadReport('excel')} disabled={!!downloading} className="h-9 shadow-sm">
                    <Download className="mr-2 h-4 w-4" /> {downloading === 'excel' ? 'Downloading…' : 'Excel'}
                  </Button>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, val]) => (
            <Card key={key} className="glass-card bg-background/80 backdrop-blur-xl border-0 shadow-sm text-center">
              <CardContent className="p-4">
                <div className="text-xl font-bold text-primary">
                  {typeof val === 'number' && val > 1000 ? fmtCurrency(val) : val}
                </div>
                <div className="text-xs text-muted-foreground mt-1 capitalize font-medium">{key.replace(/_/g,' ')}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reportData && (
        <Card className="glass-card overflow-hidden border-0 shadow-sm">
          <div className="px-4 py-3 border-b bg-muted/40 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {REPORT_TYPES.find(t => t.key === activeTab)?.label}
            </span>
            <Badge variant="outline" className="text-xs text-muted-foreground bg-background/50">
              {reportData.length} records
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {renderTableHeaders()}
              </TableHeader>
              <TableBody>
                {renderTableRows()}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {!reportData && !loading && (
        <Card className="glass-card border-dashed border-2 shadow-none bg-transparent">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileBarChart className="h-6 w-6 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Report Generated</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Select filters and click Generate Report to view your inventory data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
