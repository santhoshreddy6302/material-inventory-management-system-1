import React, { useState, useEffect } from 'react';
import { Plus, FolderKanban, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { projectService } from '../../services/projectService';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import { fmtDate, fmtCurrency, getStatusColor, getStatusLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';

interface Project {
  id: number;
  name: string;
  project_code: string;
  description: string | null;
  location: string | null;
  client_name: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: ProjectStatus;
  manager_id: number | null;
  manager_name: string | null;
  site_count: number;
}

const STATUSES: ProjectStatus[] = ['planning', 'active', 'completed', 'on_hold', 'cancelled'];

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  client_name: z.string().optional(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']),
  manager_id: z.string().optional(),
});
type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectList() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '', description: '', location: '', client_name: '',
      start_date: '', end_date: '', budget: 0, status: 'planning', manager_id: 'none'
    }
  });

  useEffect(() => { fetchData(); }, [page, search, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await projectService.getAll({ page, limit: 12, search, ...filters });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    form.reset({
      name: '', description: '', location: '', client_name: '',
      start_date: '', end_date: '', budget: 0, status: 'planning', manager_id: 'none'
    });
    setModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    form.reset({
      name: p.name,
      description: p.description || '',
      location: p.location || '',
      client_name: p.client_name || '',
      start_date: p.start_date?.split('T')[0] || '',
      end_date: p.end_date?.split('T')[0] || '',
      budget: p.budget || 0,
      status: p.status,
      manager_id: p.manager_id ? String(p.manager_id) : 'none'
    });
    setModal(true);
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setSaving(true);
    try {
      const payload = { 
        ...values, 
        budget: values.budget || 0, 
        manager_id: values.manager_id && values.manager_id !== 'none' ? parseInt(values.manager_id) : null 
      };
      const { data: r } = editing 
        ? await projectService.update(editing.id, payload) 
        : await projectService.create(payload);
        
      if (r.success) { 
        toast.success(editing ? 'Project updated' : 'Project created'); 
        setModal(false); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.message || 'An error occurred'); 
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete project "${name}"?`)) return;
    try {
      const { data: r } = await projectService.remove(id);
      if (r.success) { toast.success('Deleted'); fetchData(); }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-header flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><FolderKanban size={22} /> Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} projects</p>
        </div>
        {canEdit && <Button onClick={openAdd}><Plus size={15} className="mr-1" /> New Project</Button>}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
          <SearchFilter 
            value={search} onChange={v => { setSearch(v); setPage(1); }} 
            placeholder="Search projects…"
            filters={[{ key: 'status', label: 'Status', type: 'select', options: STATUSES.map(s => ({ value: s, label: getStatusLabel(s) })) }]}
            filterValues={filters} onFilterChange={(k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); }} 
          />
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw size={13} /></Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">No projects found</TableCell></TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-foreground">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.project_code}</div>
                    </TableCell>
                    <TableCell>{row.client_name || '—'}</TableCell>
                    <TableCell>{row.location || '—'}</TableCell>
                    <TableCell>{row.manager_name || '—'}</TableCell>
                    <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-500">{row.site_count}</span></TableCell>
                    <TableCell>{fmtCurrency(row.budget)}</TableCell>
                    <TableCell>{fmtDate(row.start_date)}</TableCell>
                    <TableCell><span className={getStatusColor(row.status)}>{getStatusLabel(row.status)}</span></TableCell>
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
            <DialogTitle>{editing ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="client_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="start_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="end_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (₹)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
