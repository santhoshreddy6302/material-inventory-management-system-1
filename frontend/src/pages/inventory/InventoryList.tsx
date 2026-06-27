import React, { useState, useEffect } from 'react';
import { Warehouse, Settings, RefreshCw, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { inventoryService } from '../../services/inventoryService';
import { siteService } from '../../services/siteService';
import { useAuth } from '../../context/AuthContext';
import { fmtCurrency, fmtNumber, fmtDateTime } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

interface Inventory {
  id: number;
  material_id: number;
  site_id: number;
  material_name: string;
  material_code: string;
  category_name?: string;
  site_name: string;
  current_stock: string;
  minimum_threshold: number;
  unit: string;
  cost_per_unit: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated: string;
}

interface Transaction {
  id: number;
  created_at: string;
  transaction_type: string;
  quantity: string;
  balance_after: string;
  total_cost: number;
  reference_type?: string;
  reference_id?: number;
  created_by_name?: string;
}

interface Site {
  id: number;
  name: string;
}

const adjustSchema = z.object({
  site_id: z.string().min(1, 'Site is required'),
  material_id: z.string().min(1, 'Material ID is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  notes: z.string().optional(),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

export default function InventoryList() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<Inventory[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  const [adjModal, setAdjModal] = useState(false);
  const [ledgerModal, setLedgerModal] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Inventory | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [saving, setSaving] = useState(false);

  const adjustForm = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { site_id: '', material_id: '', quantity: '', notes: '' },
  });

  useEffect(() => {
    siteService.getAllSimple().then((r: any) => {
      if (r.data.success) setSites(r.data.data);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, search, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await inventoryService.getAll({ page, limit: 15, search, ...filters });
      if (r.success) {
        setData(r.data);
        setPagination(r.pagination);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openLedger = async (inv: Inventory) => {
    setSelectedInv(inv);
    setLedgerModal(true);
    setTxLoading(true);
    try {
      const { data: r } = await inventoryService.getTransactions({
        material_id: inv.material_id,
        site_id: inv.site_id,
        limit: 20,
      });
      if (r.success) setTransactions(r.data);
    } catch (e) {
      console.error(e);
    }
    setTxLoading(false);
  };

  const handleAdjust = async (values: AdjustFormValues) => {
    setSaving(true);
    try {
      const { data: r } = await inventoryService.adjustStock({
        ...values,
        quantity: parseFloat(values.quantity),
      });
      if (r.success) {
        toast.success('Stock adjusted');
        setAdjModal(false);
        adjustForm.reset();
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error adjusting stock');
    }
    setSaving(false);
  };

  const txColors: Record<string, string> = {
    purchase: 'text-green-600',
    usage: 'text-orange-600',
    wastage: 'text-red-600',
    transfer_in: 'text-blue-600',
    transfer_out: 'text-purple-600',
    adjustment: 'text-gray-600',
  };

  const filterDefs = [
    { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => ({ value: s.id.toString(), label: s.name })) },
    { key: 'low_stock', label: 'Show Low Stock', type: 'select', options: [{ value: 'true', label: 'Low Stock Only' }] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Warehouse size={22} className="text-primary" /> Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} inventory entries</p>
        </div>
        {hasRole('admin', 'procurement_staff', 'site_engineer') && (
          <Button onClick={() => setAdjModal(true)} className="gap-2">
            <Settings size={15} /> Adjust Stock
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <SearchFilter
            value={search}
            onChange={(v: string) => { setSearch(v); setPage(1); }}
            placeholder="Search inventory…"
            filters={filterDefs}
            filterValues={filters}
            onFilterChange={(k: string, v: any) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); }}
          />
          <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
            <RefreshCw size={14} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No inventory entries found.</TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.material_name}</div>
                      <div className="text-xs text-muted-foreground">{row.material_code} · {row.category_name || '—'}</div>
                    </TableCell>
                    <TableCell>{row.site_name}</TableCell>
                    <TableCell>
                      <div className={`font-semibold ${parseFloat(row.current_stock) <= 0 ? 'text-red-600' : parseFloat(row.current_stock) <= row.minimum_threshold ? 'text-yellow-600' : 'text-green-600'}`}>
                        {fmtNumber(row.current_stock)} {row.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">Min: {fmtNumber(row.minimum_threshold)}</div>
                    </TableCell>
                    <TableCell>{fmtCurrency(parseFloat(row.current_stock) * parseFloat(row.cost_per_unit))}</TableCell>
                    <TableCell>
                      {row.stock_status === 'in_stock' && <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">In Stock</Badge>}
                      {row.stock_status === 'low_stock' && <Badge variant="default" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200">Low Stock</Badge>}
                      {row.stock_status === 'out_of_stock' && <Badge variant="destructive">Out of Stock</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDateTime(row.last_updated)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openLedger(row)} className="h-8 gap-1 text-primary">
                        <TrendingUp size={14} /> Ledger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Adjust Modal */}
      <Dialog open={adjModal} onOpenChange={setAdjModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <Form {...adjustForm}>
            <form onSubmit={adjustForm.handleSubmit(handleAdjust)} className="space-y-4">
              <FormField
                control={adjustForm.control}
                name="site_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adjustForm.control}
                name="material_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material ID <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Material ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adjustForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Positive to add, negative to deduct" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adjustForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Reason for adjustment..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAdjModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Adjust'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ledger Modal */}
      <Dialog open={ledgerModal} onOpenChange={setLedgerModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Stock Ledger — {selectedInv?.material_name} @ {selectedInv?.site_name}</DialogTitle>
          </DialogHeader>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No transactions found</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{fmtDateTime(t.created_at)}</TableCell>
                        <TableCell>
                          <span className={`font-medium capitalize ${txColors[t.transaction_type] || 'text-gray-600'}`}>
                            {t.transaction_type.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className={`font-mono font-semibold ${parseFloat(t.quantity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(t.quantity) >= 0 ? '+' : ''}{fmtNumber(t.quantity)}
                        </TableCell>
                        <TableCell className="font-mono">{fmtNumber(t.balance_after)}</TableCell>
                        <TableCell>{t.total_cost > 0 ? fmtCurrency(t.total_cost) : '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.reference_type || '—'} {t.reference_id ? `#${t.reference_id}` : ''}
                        </TableCell>
                        <TableCell className="text-xs">{t.created_by_name || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
