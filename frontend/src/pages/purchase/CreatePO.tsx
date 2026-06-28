import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';
import { projectService } from '../../services/projectService';
import { siteService } from '../../services/siteService';
import { materialService } from '../../services/materialService';
import { fmtCurrency } from '../../utils/helpers';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const itemSchema = z.object({
  material_id: z.string().min(1, 'Required'),
  material_name: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.string().min(1, 'Required').refine(v => parseFloat(v) > 0, 'Must be > 0'),
  unit_price: z.string().min(1, 'Required').refine(v => parseFloat(v) >= 0, 'Must be >= 0'),
  tax_percentage: z.number().optional(),
});

const poSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_delivery: z.string().optional(),
  project_id: z.string().optional(),
  site_id: z.string().optional(),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

type POFormValues = z.infer<typeof poSchema>;

export default function CreatePO() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: '',
      project_id: '',
      site_id: '',
      delivery_address: '',
      notes: '',
      items: [{ material_id: '', material_name: '', unit: '', quantity: '', unit_price: '', tax_percentage: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  useEffect(() => {
    supplierService.getAllSimple().then((r: any) => { if (r.data?.success) setSuppliers(r.data.data || []); }).catch(() => setSuppliers([]));
    projectService.getAll({ limit: 100 }).then((r: any) => { if (r.data?.success) setProjects(r.data.data || []); }).catch(() => setProjects([]));
    siteService.getAllSimple().then((r: any) => { if (r.data?.success) setSites(r.data.data || []); }).catch(() => setSites([]));
    materialService.getAll({ limit: 100, is_active: 'true' }).then((r: any) => { if (r.data?.success) setMaterials(r.data.data || []); }).catch(() => setMaterials([]));
  }, []);

  const watchItems = form.watch("items");
  const watchItemsArray = Array.isArray(watchItems) ? watchItems : [];
  const subtotal = watchItemsArray.reduce((acc, item) => acc + (parseFloat(item?.quantity || '0') * parseFloat(item?.unit_price || '0')), 0);

  const onSubmit = async (values: POFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        supplier_id: parseInt(values.supplier_id),
        project_id: values.project_id ? parseInt(values.project_id) : null,
        site_id: values.site_id ? parseInt(values.site_id) : null,
        items: values.items.map(i => ({
          material_id: parseInt(i.material_id),
          quantity: parseFloat(i.quantity),
          unit_price: parseFloat(i.unit_price),
          tax_percentage: i.tax_percentage || 0,
        }))
      };
      const { data } = await purchaseService.create(payload);
      if (data.success) {
        toast.success('Purchase order created');
        navigate('/purchase-orders');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error creating PO');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-orders')} className="rounded-full">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart size={22} className="text-primary" /> Create Purchase Order
          </h1>
          <p className="text-sm text-muted-foreground">Fill details and add materials</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Details */}
          <div className="glass-card bg-background/80 backdrop-blur-xl p-5 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground border-b pb-2">Order Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={form.control} name="supplier_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(suppliers || []).map(s => s && s.id && <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="order_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expected_delivery" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Delivery</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="project_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(projects || []).map(p => p && p.id && <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="site_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(sites || []).map(s => s && s.id && <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="delivery_address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address</FormLabel>
                  <FormControl><Input placeholder="Delivery address" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Any notes for this purchase order..." {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Items */}
          <div className="glass-card bg-background/80 backdrop-blur-xl p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-sm font-semibold text-foreground">Order Items</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ material_id: '', material_name: '', unit: '', quantity: '', unit_price: '', tax_percentage: 0 })} className="gap-2 text-xs h-8">
                <Plus size={14} /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((fieldItem, idx) => (
                <div key={fieldItem.id} className="grid grid-cols-12 gap-3 items-end p-4 bg-muted/30 rounded-lg border">
                  <div className="col-span-12 sm:col-span-4">
                    <FormField control={form.control} name={`items.${idx}.material_id`} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Material <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={(val) => {
                          field.onChange(val);
                          const mat = (materials || []).find(m => m && m.id && m.id.toString() === val);
                          if (mat) {
                            form.setValue(`items.${idx}.material_name`, mat.name);
                            form.setValue(`items.${idx}.unit`, mat.unit);
                            form.setValue(`items.${idx}.unit_price`, mat.cost_per_unit?.toString() || '0');
                          }
                        }} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {(materials || []).map(m => m && m.id && <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.unit})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <FormField control={form.control} name={`items.${idx}.unit`} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Unit</FormLabel>
                        <FormControl><Input readOnly placeholder="Unit" className="bg-muted" {...field} value={field.value || ''} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <FormField control={form.control} name={`items.${idx}.quantity`} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Quantity <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="number" min="0.01" step="0.01" placeholder="0" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="col-span-8 sm:col-span-2">
                    <FormField control={form.control} name={`items.${idx}.unit_price`} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Unit Price (₹) <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="number" min="0" step="0.01" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="col-span-4 sm:col-span-1">
                    <FormLabel className="text-xs block mb-2">Total</FormLabel>
                    <div className="text-sm font-semibold text-foreground py-2 h-10 flex items-center">
                      {fmtCurrency(parseFloat(watchItemsArray[idx]?.quantity || '0') * parseFloat(watchItemsArray[idx]?.unit_price || '0'))}
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end pb-1">
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10">
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t">
              <div className="text-right space-y-1 bg-muted/50 p-4 rounded-xl min-w-[200px]">
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground ml-4">{fmtCurrency(subtotal)}</span>
                </div>
                <div className="text-lg font-bold text-primary flex justify-between items-center pt-2 border-t mt-2">
                  <span>Total:</span>
                  <span className="ml-4">{fmtCurrency(subtotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/purchase-orders')}>Cancel</Button>
            <Button type="submit" disabled={saving} className="px-8 font-medium shadow-md">
              {saving ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
