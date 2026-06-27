import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { enquiryService } from '../../services/enquiryService';
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

interface Enquiry {
  id: string;
  client_name: string;
  details: string;
  status: string;
}

const enquirySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.string().min(1, 'Status is required'),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

export default function Enquiries() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<Enquiry[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'pending',
    }
  });

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await enquiryService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    form.reset({ title: '', description: '', status: 'pending' }); 
    setModal(true); 
  };
  
  const openEdit = (item: Enquiry) => { 
    setEditing(item); 
    form.reset({ title: item.client_name, description: item.details, status: item.status }); 
    setModal(true); 
  };

  const onSubmit = async (values: EnquiryFormValues) => {
    setSaving(true);
    try {
      const payload = {
        client_name: values.title,
        details: values.description,
        status: values.status
      };
      const { data: r } = editing 
        ? await enquiryService.update(editing.id, payload) 
        : await enquiryService.create(payload);
        
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
      const { data: r } = await enquiryService.remove(id);
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
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Enquiries</h1>
            <p className="text-sm text-muted-foreground">Manage issues and enquiries</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Enquiry
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
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
                    No enquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{item.client_name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.details}>{item.details}</TableCell>
                    <TableCell>
                      {item.status === 'resolved' ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Resolved</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Pending</Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-muted-foreground hover:text-blue-600">
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
            <DialogTitle>{editing ? 'Edit Enquiry' : 'Add Enquiry'}</DialogTitle>
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
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea 
                      {...field} 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? 'Saving...' : 'Save Enquiry'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
