import { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { labourService } from '../../services/labourService';
import { siteService } from '../../services/siteService';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

interface LabourAttendance {
  id: string;
  siteId: string;
  date: string;
  totalWorkers: number;
  skilledWorkers: number;
  unskilledWorkers: number;
  contractorName: string;
  notes: string;
}

const labourSchema = z.object({
  site_id: z.string().min(1, 'Site is required'),
  date: z.string().min(1, 'Date is required'),
  total_workers: z.union([z.string(), z.number()]).refine(val => val !== '', { message: 'Total workers required' }),
  skilled_workers: z.union([z.string(), z.number()]),
  unskilled_workers: z.union([z.string(), z.number()]),
  contractor_name: z.string().optional(),
  notes: z.string().optional(),
});

type LabourFormValues = z.infer<typeof labourSchema>;

export default function Labour() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager', 'site_engineer');
  
  const [data, setData] = useState<LabourAttendance[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<LabourAttendance | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<LabourFormValues>({
    resolver: zodResolver(labourSchema),
    defaultValues: {
      site_id: '',
      date: new Date().toISOString().split('T')[0],
      total_workers: '',
      skilled_workers: '',
      unskilled_workers: '',
      contractor_name: '',
      notes: '',
    }
  });

  useEffect(() => { 
    fetchData(); 
    fetchSites();
  }, [page]);

  const fetchSites = async () => {
    try {
      const { data: r } = await siteService.getAll({ limit: 100 });
      if (r.success) setSites(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await labourService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch labour records');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    form.reset({ 
      site_id: '', 
      date: new Date().toISOString().split('T')[0], 
      total_workers: '', 
      skilled_workers: '', 
      unskilled_workers: '', 
      contractor_name: '', 
      notes: '' 
    }); 
    setModal(true); 
  };
  
  const openEdit = (item: any) => { 
    setEditing(item); 
    form.reset({ 
      site_id: String(item.site_id), 
      date: item.date ? item.date.split('T')[0] : '', 
      total_workers: item.total_workers,
      skilled_workers: item.skilled_workers,
      unskilled_workers: item.unskilled_workers,
      contractor_name: item.contractor_name || '',
      notes: item.notes || ''
    }); 
    setModal(true); 
  };

  const onSubmit = async (values: LabourFormValues) => {
    setSaving(true);
    try {
      const { data: r } = editing 
        ? await labourService.update(editing.id, values) 
        : await labourService.create(values);
        
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
      const { data: r } = await labourService.remove(id);
      if (r.success) { 
        toast.success('Deleted successfully'); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error deleting record'); 
    }
  };

  const getSiteName = (siteId: string) => {
    const s = sites.find(x => String(x.id) === String(siteId));
    return s ? s.name : `Site #${siteId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Labour Details & Attendance</h1>
            <p className="text-sm text-muted-foreground">Manage daily labour workforce across sites</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Record Attendance
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Total Workers</TableHead>
                <TableHead>Skilled/Unskilled</TableHead>
                <TableHead>Contractor</TableHead>
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
                    No labour attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item: any) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getSiteName(item.site_id)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        {item.total_workers}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.skilled_workers} / {item.unskilled_workers}
                    </TableCell>
                    <TableCell>{item.contractor_name || 'N/A'}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-muted-foreground hover:text-indigo-600">
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
            <DialogTitle>{editing ? 'Edit Labour Attendance' : 'Record Labour Attendance'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="site_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select Site</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="total_workers" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total</FormLabel>
                    <FormControl><Input type="number" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="skilled_workers" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skilled</FormLabel>
                    <FormControl><Input type="number" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unskilled_workers" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unskilled</FormLabel>
                    <FormControl><Input type="number" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="contractor_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contractor Name (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. ABC Construction" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Remarks</FormLabel>
                  <FormControl><Input placeholder="Any remarks" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? 'Saving...' : 'Save Record'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
