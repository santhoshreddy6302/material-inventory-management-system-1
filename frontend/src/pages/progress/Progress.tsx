import { useState, useEffect } from 'react';
import { Plus, BarChart, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { progressService } from '../../services/progressService';
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

interface ProgressReport {
  id: string;
  site_id: number;
  recorded_by: number;
  report_date: string;
  progress_percentage: string | number;
  work_completed?: string;
  issues_faced?: string;
}

const progressSchema = z.object({
  site_id: z.union([z.string(), z.number()]).refine(val => val !== '', { message: 'Site is required' }),
  report_date: z.string().min(1, 'Date is required'),
  progress_percentage: z.union([z.string(), z.number()]).refine(val => val !== '', { message: 'Progress percentage is required' }),
  work_completed: z.string().min(1, 'Work completed is required'),
  issues_faced: z.string().optional().or(z.literal('')),
});

type ProgressFormValues = z.infer<typeof progressSchema>;

export default function Progress() {
  const { hasRole, user } = useAuth();
  const canEdit = hasRole('admin', 'project_manager', 'site_engineer');
  
  const [data, setData] = useState<ProgressReport[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ProgressReport | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      site_id: '',
      report_date: new Date().toISOString().split('T')[0],
      progress_percentage: '',
      work_completed: '',
      issues_faced: '',
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
      const { data: r } = await progressService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch progress reports');
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
      site_id: sites.length > 0 ? sites[0].id.toString() : '', 
      report_date: new Date().toISOString().split('T')[0], 
      progress_percentage: '', 
      work_completed: '', 
      issues_faced: '' 
    }); 
    setModal(true); 
  };
  
  const openEdit = (item: ProgressReport) => { 
    setEditing(item); 
    form.reset({ 
      site_id: item.site_id.toString(), 
      report_date: item.report_date ? item.report_date.split('T')[0] : '', 
      progress_percentage: item.progress_percentage, 
      work_completed: item.work_completed || '', 
      issues_faced: item.issues_faced || '' 
    }); 
    setModal(true); 
  };

  const onSubmit = async (values: ProgressFormValues) => {
    setSaving(true);
    try {
      const payload = {
        site_id: parseInt(values.site_id.toString(), 10),
        report_date: values.report_date,
        progress_percentage: Number(values.progress_percentage),
        work_completed: values.work_completed,
        issues_faced: values.issues_faced || null,
        recorded_by: user?.id ? parseInt(user.id.toString(), 10) : 7,
      };

      const { data: r } = editing 
        ? await progressService.update(editing.id, payload) 
        : await progressService.create(payload);
        
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
      const { data: r } = await progressService.remove(id);
      if (r.success) { 
        toast.success('Deleted successfully'); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error deleting record'); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progress Reports</h1>
            <p className="text-sm text-muted-foreground">Manage project progress reports</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Progress
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Site Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Progress (%)</TableHead>
                <TableHead>Work Completed</TableHead>
                <TableHead>Issues Faced</TableHead>
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
                    No progress reports found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{getSiteName(item.site_id)}</TableCell>
                    <TableCell>{fmtDate(item.report_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] bg-secondary rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, Math.max(0, Number(item.progress_percentage)))}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.progress_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.work_completed}>{item.work_completed || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.issues_faced}>{item.issues_faced || '—'}</TableCell>
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
            <DialogTitle>{editing ? 'Edit Progress Report' : 'Add Progress Report'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="site_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
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

              <FormField control={form.control} name="report_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="progress_percentage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="work_completed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Completed</FormLabel>
                  <FormControl>
                    <textarea 
                      {...field} 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="issues_faced" render={({ field }) => (
                <FormItem>
                  <FormLabel>Issues Faced (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? 'Saving...' : 'Save Progress'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
