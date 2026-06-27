import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { materialService } from '../../services/materialService';
import { supplierService } from '../../services/supplierService';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import { fmtCurrency, fmtNumber } from '../../utils/helpers';
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

interface Material {
  id: number;
  name: string;
  material_code: string;
  category_id: number | null;
  category_name: string | null;
  unit: string;
  cost_per_unit: number;
  minimum_threshold: number;
  reorder_quantity: number | null;
  supplier_id: number | null;
  supplier_name: string | null;
  description: string | null;
  specifications: string | null;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  cost_per_unit: z.coerce.number().min(0, "Cost must be >= 0"),
  minimum_threshold: z.coerce.number().min(0, "Threshold must be >= 0"),
  reorder_quantity: z.coerce.number().min(0).optional(),
  supplier_id: z.string().optional(),
  description: z.string().optional(),
  specifications: z.string().optional(),
});
type MaterialFormValues = z.infer<typeof materialSchema>;

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

export default function MaterialList() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'procurement_staff');
  
  const [data, setData] = useState<Material[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [catModal, setCatModal] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      category_id: 'none',
      unit: '',
      cost_per_unit: 0,
      minimum_threshold: 0,
      reorder_quantity: 0,
      supplier_id: 'none',
      description: '',
      specifications: ''
    }
  });

  const catForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6B7280'
    }
  });

  useEffect(() => { fetchCategories(); fetchSuppliers(); }, []);
  useEffect(() => { fetchData(); }, [page, search, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await materialService.getAll({ page, limit: 12, search, ...filters });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data } = await materialService.getCategories();
      if (data.success) setCategories(data.data);
    } catch (e) {}
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await supplierService.getAllSimple();
      if (data.success) setSuppliers(data.data);
    } catch (e) {}
  };

  const openAdd = () => {
    setEditing(null);
    form.reset({
      name: '',
      category_id: 'none',
      unit: '',
      cost_per_unit: 0,
      minimum_threshold: 0,
      reorder_quantity: 0,
      supplier_id: 'none',
      description: '',
      specifications: ''
    });
    setModalOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditing(m);
    form.reset({
      name: m.name,
      category_id: m.category_id ? String(m.category_id) : 'none',
      unit: m.unit,
      cost_per_unit: m.cost_per_unit,
      minimum_threshold: m.minimum_threshold,
      reorder_quantity: m.reorder_quantity || 0,
      supplier_id: m.supplier_id ? String(m.supplier_id) : 'none',
      description: m.description || '',
      specifications: m.specifications || ''
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: MaterialFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        category_id: values.category_id === 'none' || !values.category_id ? null : parseInt(values.category_id),
        supplier_id: values.supplier_id === 'none' || !values.supplier_id ? null : parseInt(values.supplier_id),
        reorder_quantity: values.reorder_quantity || 0
      };
      
      if (editing) {
        const { data } = await materialService.update(editing.id, payload);
        if (data.success) { toast.success('Material updated'); setModalOpen(false); fetchData(); }
      } else {
        const { data } = await materialService.create(payload);
        if (data.success) { toast.success('Material created'); setModalOpen(false); fetchData(); }
      }
    } catch (e: any) { 
      toast.error(e.message || 'An error occurred'); 
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete material "${name}"?`)) return;
    try {
      const { data } = await materialService.remove(id);
      if (data.success) { toast.success('Material deleted'); fetchData(); }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
  };

  const onCatSubmit = async (values: CategoryFormValues) => {
    try {
      const { data } = await materialService.createCategory(values);
      if (data.success) { 
        toast.success('Category created'); 
        fetchCategories(); 
        setCatModal(false); 
        catForm.reset(); 
      }
    } catch (e: any) { toast.error(e.message || 'An error occurred'); }
  };

  const filterDefs = [
    { key: 'category_id', label: 'Category', type: 'select', options: categories.map(c => ({ value: String(c.id), label: c.name })) },
    { key: 'is_active', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-header flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Package size={22} /> Materials</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} total materials</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCatModal(true)} className="text-xs">+ Category</Button>
            <Button onClick={openAdd}><Plus size={16} className="mr-1" /> Add Material</Button>
          </div>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
          <SearchFilter
            value={search} onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search materials…"
            filters={filterDefs}
            filterValues={filters}
            onFilterChange={(k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); }}
          />
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw size={14} /></Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost/Unit</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">No materials found</TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.material_code}</div>
                    </TableCell>
                    <TableCell>
                      {row.category_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {row.category_name}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>{fmtCurrency(row.cost_per_unit)}</TableCell>
                    <TableCell>{fmtNumber(row.minimum_threshold)} {row.unit}</TableCell>
                    <TableCell>{row.supplier_name || '—'}</TableCell>
                    <TableCell>
                      {row.is_active ? 
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">Active</span> : 
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">Inactive</span>
                      }
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] glass-card backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Material' : 'Add New Material'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Material Name *</FormLabel>
                    <FormControl><Input placeholder="e.g. OPC 53 Grade Cement" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <FormControl><Input placeholder="e.g. Bags, MT, Nos, Sqm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost_per_unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit (₹) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minimum_threshold" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock Threshold *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reorder_quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Quantity</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supplier_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Material description..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="specifications" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Specifications</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Technical specifications..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="sm:max-w-[400px] glass-card backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form onSubmit={catForm.handleSubmit(onCatSubmit)} className="space-y-4">
              <FormField control={catForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input placeholder="Category name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={catForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={catForm.control} name="color" render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl><Input type="color" className="h-10 cursor-pointer w-full p-1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCatModal(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
