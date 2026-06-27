import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { supplierService } from '../../services/supplierService';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import { fmtCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Checkbox } from '../../components/ui/checkbox';

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Supplier {
  id: number;
  name: string;
  supplier_code: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gst_number: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  notes: string | null;
  is_active: boolean;
  total_orders: number;
  total_purchased: number;
}

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  gst_number: z.string().optional(),
  payment_terms: z.string().optional(),
  credit_limit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SupplierList() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'procurement_staff');
  
  const [data, setData] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '', contact_person: '', email: '', phone: '', address: '', 
      city: '', state: '', gst_number: '', payment_terms: '', credit_limit: 0, notes: '',
      is_active: true
    }
  });

  useEffect(() => { fetchData(); }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await supplierService.getAll({ page, limit: 12, search });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    form.reset({
      name: '', contact_person: '', email: '', phone: '', address: '', 
      city: '', state: '', gst_number: '', payment_terms: '', credit_limit: 0, notes: '',
      is_active: true
    });
    setModal(true);
  };

  const openEdit = (item: Supplier) => {
    setEditing(item);
    form.reset({
      name: item.name,
      contact_person: item.contact_person || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      gst_number: item.gst_number || '',
      payment_terms: item.payment_terms || '',
      credit_limit: item.credit_limit || 0,
      notes: item.notes || '',
      is_active: item.is_active
    });
    setModal(true);
  };

  const onSubmit = async (values: SupplierFormValues) => {
    setSaving(true);
    try {
      const { data: r } = editing 
        ? await supplierService.update(editing.id, values) 
        : await supplierService.create(values);
      if (r.success) { 
        toast.success(editing ? 'Supplier updated' : 'Supplier created'); 
        setModal(false); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.message || 'An error occurred'); 
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try {
      const { data: r } = await supplierService.remove(id);
      if (r.success) { toast.success('Deleted'); fetchData(); }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-header flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Truck size={22} /> Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} suppliers</p>
        </div>
        {canEdit && <Button onClick={openAdd}><Plus size={15} className="mr-1" /> New Supplier</Button>}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3 items-center justify-between">
          <SearchFilter value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search suppliers…" />
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw size={13} /></Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Purchased</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">No suppliers found</TableCell></TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-foreground">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.supplier_code}</div>
                    </TableCell>
                    <TableCell>{row.contact_person || '—'}</TableCell>
                    <TableCell>{row.phone || '—'}</TableCell>
                    <TableCell>{row.email || '—'}</TableCell>
                    <TableCell>{[row.city, row.state].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-500">{row.total_orders}</span></TableCell>
                    <TableCell>{fmtCurrency(row.total_purchased)}</TableCell>
                    <TableCell>
                      {row.is_active ? 
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">Active</span> : 
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">Inactive</span>
                      }
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(row)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(row.id, row.name)}><Trash2 size={14} /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-[700px] glass-card backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contact_person" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gst_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="payment_terms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl><Input placeholder="e.g. Net 30" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="credit_limit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (₹)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {editing && (
                  <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 col-span-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Status</FormLabel>
                        <p className="text-xs text-muted-foreground">Mark this supplier as active to allow purchasing materials from them.</p>
                      </div>
                    </FormItem>
                  )} />
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
