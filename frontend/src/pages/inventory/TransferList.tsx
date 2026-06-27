import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { transferService } from '../../services/transferService';
import { siteService } from '../../services/siteService';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, fmtNumber, getStatusColor, getStatusLabel } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';

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

interface Transfer {
  id: number;
  transfer_code: string;
  material_name: string;
  material_code: string;
  from_site_name: string;
  to_site_name: string;
  quantity: string;
  unit: string;
  transfer_date: string;
  status: string;
  requested_by_name: string;
}

interface Site {
  id: number;
  name: string;
}

const transferSchema = z.object({
  from_site_id: z.string().min(1, 'From Site is required'),
  to_site_id: z.string().min(1, 'To Site is required'),
  material_id: z.string().min(1, 'Material ID is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  transfer_date: z.string().min(1, 'Transfer Date is required'),
  reason: z.string().optional(),
}).refine(data => data.from_site_id !== data.to_site_id, {
  message: "From and To sites cannot be the same",
  path: ["to_site_id"]
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function TransferList() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<Transfer[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [saving, setSaving] = useState(false);

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_site_id: '',
      to_site_id: '',
      material_id: '',
      quantity: '',
      transfer_date: new Date().toISOString().split('T')[0],
      reason: ''
    },
  });

  useEffect(() => {
    siteService.getAllSimple().then((r: any) => {
      if (r.data.success) setSites(r.data.data);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await transferService.getAll({ page, limit: 15 });
      if (r.success) {
        setData(r.data);
        setPagination(r.pagination);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async (values: TransferFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        quantity: parseFloat(values.quantity),
        material_id: parseInt(values.material_id),
      };
      const { data: r } = await transferService.create(payload);
      if (r.success) {
        toast.success('Transfer request created');
        setModalOpen(false);
        transferForm.reset();
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error creating transfer');
    }
    setSaving(false);
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    if (!window.confirm(`Mark transfer as ${status}?`)) return;
    try {
      const { data: r } = await transferService.updateStatus(id, { status });
      if (r.success) {
        toast.success('Status updated');
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight size={22} className="text-primary" /> Stock Transfers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} transfers</p>
        </div>
        {hasRole('admin', 'site_engineer', 'project_manager') && (
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={15} /> New Transfer
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>By</TableHead>
                {hasRole('admin', 'project_manager') && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No transfers found.</TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-primary">{row.transfer_code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.material_name}</div>
                      <div className="text-xs text-muted-foreground">{row.material_code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">{row.from_site_name}</div>
                        <div className="text-muted-foreground">→ {row.to_site_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {fmtNumber(row.quantity)} {row.unit || ''}
                    </TableCell>
                    <TableCell>{fmtDate(row.transfer_date)}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(row.status)}>{getStatusLabel(row.status)}</span>
                    </TableCell>
                    <TableCell>{row.requested_by_name}</TableCell>
                    {hasRole('admin', 'project_manager') && (
                      <TableCell>
                        {row.status === 'pending' ? (
                          <Button size="sm" onClick={() => handleStatusUpdate(row.id, 'completed')}>Complete</Button>
                        ) : row.status === 'in_transit' ? (
                          <Button size="sm" onClick={() => handleStatusUpdate(row.id, 'completed')}>Mark Received</Button>
                        ) : null}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Stock Transfer</DialogTitle>
          </DialogHeader>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transferForm.control}
                  name="from_site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Site <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sites.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="to_site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Site <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sites.filter(s => s.id.toString() !== transferForm.watch('from_site_id')).map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transferForm.control}
                  name="material_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material ID <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input type="number" placeholder="Material ID" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input type="number" min="0.01" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={transferForm.control}
                name="transfer_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Requesting...' : 'Request Transfer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
