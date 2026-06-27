import { useState, useEffect } from 'react';
import { Plus, Settings, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { machineryService } from '../../services/machineryService';
import { siteService } from '../../services/siteService';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fmtDate } from '../../utils/helpers';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

interface Machinery {
  id: string;
  site_id: number;
  equipment_name: string;
  model: string;
  status: string;
  assigned_date?: string;
  notes?: string;
}

const machinerySchema = z.object({
  equipment_name: z.string().min(1, 'Equipment name is required'),
  site_id: z.union([z.string(), z.number()]).refine(val => val !== '', { message: 'Site is required' }),
  model: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
  assigned_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type MachineryFormValues = z.infer<typeof machinerySchema>;

export default function Machinery() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<Machinery[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Machinery | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<MachineryFormValues>({
    resolver: zodResolver(machinerySchema),
    defaultValues: {
      equipment_name: '',
      site_id: '',
      model: '',
      status: 'active',
      assigned_date: '',
      notes: '',
    }
  });

  useEffect(() => { 
    fetchData(); 
  }, [page]);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await machineryService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch machinery');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const { data: r } = await siteService.getAll({ limit: 100 });
      if (r.success) setSites(r.data);
    } catch (e) {
      console.error('Failed to fetch sites', e);
    }
  };

  const getSiteName = (id: number) => {
    const s = sites.find(site => site.id === id);
    return s ? s.name : `Site #${id}`;
  };

  const openAdd = () => { 
    setEditing(null); 
    form.reset({ 
      equipment_name: '', 
      site_id: sites.length > 0 ? sites[0].id.toString() : '', 
      model: '', 
      status: 'active', 
      assigned_date: new Date().toISOString().split('T')[0], 
      notes: '' 
    }); 
    setModal(true); 
  };
  
  const openEdit = (item: Machinery) => { 
    setEditing(item); 
    form.reset({ 
      equipment_name: item.equipment_name, 
      site_id: item.site_id.toString(), 
      model: item.model || '', 
      status: item.status, 
      assigned_date: item.assigned_date ? item.assigned_date.split('T')[0] : '', 
      notes: item.notes || '' 
    }); 
    setModal(true); 
  };

  const onSubmit = async (values: MachineryFormValues) => {
    setSaving(true);
    try {
      const payload = {
        equipment_name: values.equipment_name,
        site_id: parseInt(values.site_id.toString(), 10),
        model: values.model || null,
        status: values.status,
        assigned_date: values.assigned_date ? new Date(values.assigned_date).toISOString() : null,
        notes: values.notes || null,
      };

      const { data: r } = editing 
        ? await machineryService.update(editing.id, payload) 
        : await machineryService.create(payload);
        
      if (r.success) { 
        toast.success(editing ? 'Updated successfully' : 'Created successfully'); 
        setModal(false); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error saving record'); 
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const { data: r } = await machineryService.remove(id);
      if (r.success) { 
        toast.success('Deleted successfully'); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error deleting record'); 
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Active</Badge>;
      case 'maintenance': return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Maintenance</Badge>;
      default: return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Machinery</h1>
            <p className="text-sm text-muted-foreground">Manage machinery and equipment</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Machinery
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Assigned Site</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="h-32 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="h-32 text-center text-muted-foreground">
                    No machinery found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{item.equipment_name}</TableCell>
                    <TableCell>{item.model || '—'}</TableCell>
                    <TableCell>{getSiteName(item.site_id)}</TableCell>
                    <TableCell>{fmtDate(item.assigned_date)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-muted-foreground hover:text-cyan-600">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-border/50 bg-muted/10">
            <Pagination current={pagination.page} total={pagination.pages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Machinery' : 'Add Machinery'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="equipment_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Name</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="site_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Site</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="assigned_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Date</FormLabel>
                  <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  {saving ? 'Saving...' : 'Save Machinery'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
