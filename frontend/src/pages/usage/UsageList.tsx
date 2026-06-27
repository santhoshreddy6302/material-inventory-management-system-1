import React, { useState, useEffect } from 'react';
import { Plus, Wrench, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { usageService } from '../../services/usageService';
import { siteService } from '../../services/siteService';
import { materialService } from '../../services/materialService';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, fmtCurrency, fmtNumber } from '../../utils/helpers';
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

interface UsageRecord {
  id: number;
  usage_code: string;
  usage_date: string;
  site_name: string;
  material_name: string;
  material_code: string;
  quantity_used: string;
  unit: string;
  total_cost: number;
  purpose: string;
  recorded_by_name: string;
}

interface Site {
  id: number;
  name: string;
}

interface Material {
  id: number;
  name: string;
  unit: string;
}

const usageSchema = z.object({
  site_id: z.string().min(1, 'Site is required'),
  material_id: z.string().min(1, 'Material is required'),
  quantity_used: z.string().min(1, 'Quantity is required').refine(val => parseFloat(val) > 0, 'Must be greater than 0'),
  usage_date: z.string().min(1, 'Date is required'),
  purpose: z.string().optional(),
  work_type: z.string().optional(),
  floor_level: z.string().optional(),
  remarks: z.string().optional(),
});

type UsageFormValues = z.infer<typeof usageSchema>;

export default function UsageList() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<UsageRecord[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const usageForm = useForm<UsageFormValues>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      site_id: '',
      material_id: '',
      quantity_used: '',
      usage_date: new Date().toISOString().split('T')[0],
      purpose: '',
      work_type: '',
      floor_level: '',
      remarks: ''
    }
  });

  useEffect(() => {
    siteService.getAllSimple().then((r: any) => { if (r.data.success) setSites(r.data.data); });
    materialService.getAll({ limit: 200, is_active: 'true' }).then((r: any) => { if (r.data.success) setMaterials(r.data.data); });
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, search, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await usageService.getAll({ page, limit: 15, search, ...filters });
      if (r.success) {
        setData(r.data);
        setPagination(r.pagination);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSubmit = async (values: UsageFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        site_id: parseInt(values.site_id),
        material_id: parseInt(values.material_id),
        quantity_used: parseFloat(values.quantity_used)
      };
      const { data: r } = await usageService.create(payload);
      if (r.success) {
        toast.success('Usage recorded successfully');
        setModal(false);
        usageForm.reset();
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error recording usage');
    }
    setSaving(false);
  };

  const filterDefs = [
    { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => ({ value: s.id.toString(), label: s.name })) },
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date', label: 'To Date', type: 'date' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wrench size={22} className="text-primary" /> Material Usage
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} usage records</p>
        </div>
        {hasRole('admin', 'site_engineer', 'project_manager', 'procurement_staff') && (
          <Button onClick={() => setModal(true)} className="gap-2">
            <Plus size={15} /> Record Usage
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <SearchFilter
            value={search}
            onChange={(v: string) => { setSearch(v); setPage(1); }}
            placeholder="Search usage records…"
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
                <TableHead>Code</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Qty Used</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No usage records found</TableCell></TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id}>
                    <TableCell><span className="font-mono text-xs font-semibold text-primary">{row.usage_code}</span></TableCell>
                    <TableCell>{fmtDate(row.usage_date)}</TableCell>
                    <TableCell>{row.site_name}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.material_name}</div>
                      <div className="text-xs text-muted-foreground">{row.material_code}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-orange-600">{fmtNumber(row.quantity_used)} {row.unit}</span>
                    </TableCell>
                    <TableCell>{fmtCurrency(row.total_cost)}</TableCell>
                    <TableCell>{row.purpose || '—'}</TableCell>
                    <TableCell>{row.recorded_by_name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Material Usage</DialogTitle>
          </DialogHeader>
          <Form {...usageForm}>
            <form onSubmit={usageForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={usageForm.control} name="site_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={usageForm.control} name="material_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {materials.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.unit})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={usageForm.control} name="quantity_used" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Used <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="number" min="0.01" step="0.01" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={usageForm.control} name="usage_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={usageForm.control} name="purpose" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose / Activity</FormLabel>
                    <FormControl><Input placeholder="e.g. Slab concreting" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={usageForm.control} name="work_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Civil', 'Structural', 'Electrical', 'Plumbing', 'Finishing', 'Waterproofing', 'Other'].map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={usageForm.control} name="floor_level" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor / Level</FormLabel>
                    <FormControl><Input placeholder="e.g. G+2, Basement" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={usageForm.control} name="remarks" render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl><Textarea rows={2} {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900">
                ⚠️ Recording usage will automatically deduct from site inventory.
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Record Usage'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
