import { useState, useEffect } from 'react';
import { Plus, DollarSign, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fmtDateTime } from '../../utils/helpers';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

interface Expense {
  id: string;
  description: string;
  amount: string | number;
  expense_date: string;
}

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.union([z.string(), z.number()]).refine(val => val !== '', { message: 'Amount is required' }),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function Expenses() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await expenseService.getAll({ page, limit: 12 });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    form.reset({ description: '', amount: '', date: new Date().toISOString().split('T')[0] }); 
    setModal(true); 
  };
  
  const openEdit = (item: Expense) => { 
    setEditing(item); 
    form.reset({ 
      description: item.description, 
      amount: item.amount, 
      date: item.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0] 
    }); 
    setModal(true); 
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setSaving(true);
    try {
      const payload = { ...values, amount: Number(values.amount), expense_date: values.date };
      const { data: r } = editing 
        ? await expenseService.update(editing.id, payload) 
        : await expenseService.create(payload);
        
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
      const { data: r } = await expenseService.remove(id);
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
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
            <p className="text-sm text-muted-foreground">Manage project expenses and costs</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
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
                    No expense records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                    <TableCell>₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{item.expense_date ? new Date(item.expense_date).toLocaleDateString() : '—'}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-muted-foreground hover:text-emerald-600">
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
            <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} className="bg-background/50" /></FormControl>
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
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {saving ? 'Saving...' : 'Save Expense'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
