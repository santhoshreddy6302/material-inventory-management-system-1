import { useState, useEffect } from 'react';
import { Plus, Target, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { milestoneService } from '../../services/milestoneService';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

interface Milestone {
  id: string;
  milestone_name: string;
  due_date: string;
  status: string;
}

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.string().min(1, 'Status is required'),
});

type MilestoneFormValues = z.infer<typeof milestoneSchema>;

export default function Milestones() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<Milestone[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: '',
      date: new Date().toISOString().split('T')[0],
      status: 'upcoming',
    }
  });

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await milestoneService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch milestones');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    form.reset({ title: '', date: new Date().toISOString().split('T')[0], status: 'upcoming' }); 
    setModal(true); 
  };
  
  const openEdit = (item: Milestone) => { 
    setEditing(item); 
    form.reset({ 
      title: item.milestone_name, 
      date: item.due_date?.split('T')[0] || new Date().toISOString().split('T')[0], 
      status: item.status 
    }); 
    setModal(true); 
  };

  const onSubmit = async (values: MilestoneFormValues) => {
    setSaving(true);
    try {
      const payload = {
        milestone_name: values.title,
        due_date: values.date,
        status: values.status,
        amount: 0,
        project_id: 1
      };
      const { data: r } = editing 
        ? await milestoneService.update(editing.id, payload) 
        : await milestoneService.create(payload);
        
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
      const { data: r } = await milestoneService.remove(id);
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
      case 'completed': return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Completed</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">In Progress</Badge>;
      default: return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Upcoming</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Milestones</h1>
            <p className="text-sm text-muted-foreground">Manage project milestones</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Milestone
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 4 : 3} className="h-32 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 4 : 3} className="h-32 text-center text-muted-foreground">
                    No milestones found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{item.milestone_name}</TableCell>
                    <TableCell>{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-muted-foreground hover:text-purple-600">
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
            <DialogTitle>{editing ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {saving ? 'Saving...' : 'Save Milestone'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
