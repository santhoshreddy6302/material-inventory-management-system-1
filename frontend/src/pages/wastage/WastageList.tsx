import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { wastageService } from '../../services/wastageService';
import { siteService } from '../../services/siteService';
import { materialService } from '../../services/materialService';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, fmtCurrency, fmtNumber } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
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

interface WastageRecord {
  id: number;
  wastage_code: string;
  wastage_date: string;
  site_name: string;
  material_name: string;
  unit: string;
  quantity_wasted: string;
  total_cost: number;
  reason: string;
  preventable: boolean;
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

const REASONS = ['damage', 'expired', 'spill', 'cutting_loss', 'quality_issue', 'theft', 'other'];

const wastageSchema = z.object({
  site_id: z.string().min(1, 'Site is required'),
  material_id: z.string().min(1, 'Material is required'),
  quantity_wasted: z.string().min(1, 'Quantity is required').refine(val => parseFloat(val) > 0, 'Must be greater than 0'),
  wastage_date: z.string().min(1, 'Date is required'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
  preventable: z.boolean().default(false),
});

type WastageFormValues = z.infer<typeof wastageSchema>;

export default function WastageList() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<WastageRecord[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const wastageForm = useForm<WastageFormValues>({
    resolver: zodResolver(wastageSchema),
    defaultValues: {
      site_id: '',
      material_id: '',
      quantity_wasted: '',
      wastage_date: new Date().toISOString().split('T')[0],
      reason: '',
      description: '',
      preventable: false,
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
      const { data: r } = await wastageService.getAll({ page, limit: 15, search, ...filters });
      if (r.success) {
        setData(r.data);
        setPagination(r.pagination);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSubmit = async (values: WastageFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        site_id: parseInt(values.site_id),
        material_id: parseInt(values.material_id),
        quantity_wasted: parseFloat(values.quantity_wasted)
      };
      const { data: r } = await wastageService.create(payload);
      if (r.success) {
        toast.success('Wastage recorded');
        setModal(false);
        wastageForm.reset();
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error recording wastage');
    }
    setSaving(false);
  };

  const filterDefs = [
    { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => ({ value: s.id.toString(), label: s.name })) },
    { key: 'reason', label: 'Reason', type: 'select', options: REASONS.map(r => ({ value: r, label: r.replace(/_/g, ' ') })) },
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date', label: 'To Date', type: 'date' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trash2 size={22} className="text-destructive" /> Wastage Records
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} wastage entries</p>
        </div>
        {hasRole('admin', 'site_engineer', 'project_manager') && (
          <Button onClick={() => setModal(true)} variant="destructive" className="gap-2">
            <Plus size={15} /> Record Wastage
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <SearchFilter
            value={search}
            onChange={(v: string) => { setSearch(v); setPage(1); }}
            placeholder="Search wastage records…"
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
                <TableHead>Qty Wasted</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Preventable</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No wastage records found</TableCell></TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id}>
                    <TableCell><span className="font-mono text-xs font-semibold text-destructive">{row.wastage_code}</span></TableCell>
                    <TableCell>{fmtDate(row.wastage_date)}</TableCell>
                    <TableCell>{row.site_name}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.material_name}</div>
                      <div className="text-xs text-muted-foreground">{row.unit}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-destructive">{fmtNumber(row.quantity_wasted)} {row.unit}</span>
                    </TableCell>
                    <TableCell>{fmtCurrency(row.total_cost)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-orange-600 border-orange-200 bg-orange-50">{row.reason?.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.preventable ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </TableCell>
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
            <DialogTitle>Record Wastage</DialogTitle>
          </DialogHeader>
          <Form {...wastageForm}>
            <form onSubmit={wastageForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={wastageForm.control} name="site_id" render={({ field }) => (
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
                <FormField control={wastageForm.control} name="material_id" render={({ field }) => (
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
                <FormField control={wastageForm.control} name="quantity_wasted" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Wasted <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="number" min="0.01" step="0.01" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={wastageForm.control} name="wastage_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wastage Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={wastageForm.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {REASONS.map(r => (
                          <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex items-center space-x-2 pt-8">
                  <FormField control={wastageForm.control} name="preventable" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Was this wastage preventable?</FormLabel>
                      </div>
                    </FormItem>
                  )} />
                </div>
                <div className="md:col-span-2">
                  <FormField control={wastageForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea rows={2} placeholder="Describe the wastage..." {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                ⚠️ Recording wastage will deduct from site inventory and log the loss cost.
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={saving}>
                  {saving ? 'Saving...' : 'Record Wastage'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
