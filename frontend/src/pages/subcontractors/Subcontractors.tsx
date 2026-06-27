import { useState, useEffect } from 'react';
import { Plus, Briefcase, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { subcontractorService } from '../../services/subcontractorService';
import { projectService } from '../../services/projectService';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, fmtCurrency } from '../../utils/helpers';

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

interface SubcontractorTask {
  id: string;
  project_id: number;
  subcontractor_name: string;
  task_description: string;
  start_date?: string;
  end_date?: string;
  status: string;
  cost?: number | string;
}

const subcontractorSchema = z.object({
  subcontractor_name: z.string().min(1, 'Subcontractor name is required'),
  project_id: z.union([z.string(), z.number()]).refine(val => val !== '', { message: 'Project is required' }),
  task_description: z.string().min(1, 'Task description is required'),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  cost: z.union([z.string(), z.number()]).optional(),
  status: z.string().min(1, 'Status is required'),
});

type SubcontractorFormValues = z.infer<typeof subcontractorSchema>;

export default function Subcontractors() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<SubcontractorTask[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<SubcontractorTask | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<SubcontractorFormValues>({
    resolver: zodResolver(subcontractorSchema),
    defaultValues: {
      subcontractor_name: '',
      project_id: '',
      task_description: '',
      start_date: '',
      end_date: '',
      cost: '',
      status: 'pending',
    }
  });

  useEffect(() => { 
    fetchData(); 
  }, [page]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await subcontractorService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch subcontractor tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: r } = await projectService.getAll({ limit: 100 });
      if (r.success) {
        setProjects(r.data);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  };

  const getProjectName = (id: number) => {
    const p = projects.find(proj => proj.id === id);
    return p ? p.name : `Project #${id}`;
  };

  const openAdd = () => { 
    setEditing(null); 
    form.reset({ 
      subcontractor_name: '', 
      project_id: projects.length > 0 ? projects[0].id.toString() : '', 
      task_description: '', 
      start_date: '', 
      end_date: '', 
      cost: '', 
      status: 'pending' 
    }); 
    setModal(true); 
  };
  
  const openEdit = (item: SubcontractorTask) => { 
    setEditing(item); 
    form.reset({ 
      subcontractor_name: item.subcontractor_name, 
      project_id: item.project_id.toString(), 
      task_description: item.task_description, 
      start_date: item.start_date ? item.start_date.split('T')[0] : '', 
      end_date: item.end_date ? item.end_date.split('T')[0] : '', 
      cost: item.cost ? item.cost.toString() : '', 
      status: item.status 
    }); 
    setModal(true); 
  };

  const onSubmit = async (values: SubcontractorFormValues) => {
    setSaving(true);
    try {
      const payload = {
        project_id: parseInt(values.project_id.toString(), 10),
        subcontractor_name: values.subcontractor_name,
        task_description: values.task_description,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
        cost: values.cost ? parseFloat(values.cost.toString()) : 0,
        status: values.status,
      };

      const { data: r } = editing 
        ? await subcontractorService.update(editing.id, payload) 
        : await subcontractorService.create(payload);
        
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
      const { data: r } = await subcontractorService.remove(id);
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
          <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subcontractors</h1>
            <p className="text-sm text-muted-foreground">Manage subcontractors and tasks</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Subcontractor Task
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Subcontractor Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task Description</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="h-32 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="h-32 text-center text-muted-foreground">
                    No subcontractor tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{item.subcontractor_name}</TableCell>
                    <TableCell>{getProjectName(item.project_id)}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.task_description}</TableCell>
                    <TableCell>{fmtDate(item.start_date)}</TableCell>
                    <TableCell>{fmtDate(item.end_date)}</TableCell>
                    <TableCell>{fmtCurrency(item.cost)}</TableCell>
                    <TableCell>
                      <Badge className={
                        item.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : item.status === 'in_progress' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }>
                        {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-muted-foreground hover:text-orange-600">
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
            <DialogTitle>{editing ? 'Edit Subcontractor Task' : 'Add Subcontractor Task'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subcontractor_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcontractor Name</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="project_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="task_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="end_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (₹)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {saving ? 'Saving...' : 'Save Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
