import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { siteService } from '../../services/siteService';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Checkbox } from '../../components/ui/checkbox';

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Site {
  id: number;
  name: string;
  site_code: string;
  location: string | null;
  address: string | null;
  project_id: number | null;
  project_name: string | null;
  engineer_id: number | null;
  engineer_name: string | null;
  is_active: boolean;
}

interface ProjectBrief {
  id: number;
  name: string;
}

const siteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  address: z.string().optional(),
  project_id: z.string().optional(),
  engineer_id: z.string().optional(),
  is_active: z.boolean().default(true),
});
type SiteFormValues = z.infer<typeof siteSchema>;

export default function SiteList() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'project_manager');
  
  const [data, setData] = useState<Site[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [projects, setProjects] = useState<ProjectBrief[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: '', location: '', address: '', project_id: 'none', engineer_id: 'none', is_active: true }
  });

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then(r => { if(r.data.success) setProjects(r.data.data); }).catch(console.error);
    userService.getEngineers().then(r => { if(r.data?.success) setEngineers(r.data.data || []); }).catch(console.error);
  }, []);

  useEffect(() => { fetchData(); }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await siteService.getAll({ page, limit: 12, search });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    form.reset({ name: '', location: '', address: '', project_id: 'none', engineer_id: 'none', is_active: true });
    setModal(true);
  };

  const openEdit = (item: Site) => {
    setEditing(item);
    form.reset({
      name: item.name,
      location: item.location || '',
      address: item.address || '',
      project_id: item.project_id ? String(item.project_id) : 'none',
      engineer_id: item.engineer_id ? String(item.engineer_id) : 'none',
      is_active: item.is_active
    });
    setModal(true);
  };

  const onSubmit = async (values: SiteFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        project_id: values.project_id && values.project_id !== 'none' ? parseInt(values.project_id) : null,
        engineer_id: values.engineer_id && values.engineer_id !== 'none' ? parseInt(values.engineer_id) : null
      };
      
      const { data: r } = editing 
        ? await siteService.update(editing.id, payload) 
        : await siteService.create(payload);
        
      if (r.success) { 
        toast.success(editing ? 'Site updated' : 'Site created'); 
        setModal(false); 
        fetchData(); 
      }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete site "${name}"?`)) return;
    try {
      const { data: r } = await siteService.remove(id);
      if (r.success) { toast.success('Site deleted'); fetchData(); }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-header flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MapPin size={22} /> Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} sites</p>
        </div>
        {canEdit && <Button onClick={openAdd}><Plus size={15} className="mr-1" /> New Site</Button>}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3 items-center justify-between">
          <SearchFilter value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search sites…" />
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw size={13} /></Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Engineer</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">No sites found</TableCell></TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-foreground">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.site_code}</div>
                    </TableCell>
                    <TableCell>{row.project_name || '—'}</TableCell>
                    <TableCell>{row.location || '—'}</TableCell>
                    <TableCell>{row.engineer_name || '—'}</TableCell>
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
        <DialogContent className="sm:max-w-[500px] glass-card backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Site' : 'New Site'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Site Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="project_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="engineer_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engineer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select engineer" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {(engineers || []).map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
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
                        <p className="text-xs text-muted-foreground">Mark this site as active to allow allocations and transfers.</p>
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
