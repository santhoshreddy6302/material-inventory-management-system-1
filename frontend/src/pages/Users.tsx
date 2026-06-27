import { useState, useEffect } from 'react';
import { Plus, Edit2, RefreshCw, Users, Key, Search } from 'lucide-react';
import { userService } from '../services/userService';
import Pagination from '../components/common/Pagination';
import { fmtDateTime, ROLE_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
}

const ROLES = ['admin', 'project_manager', 'site_engineer', 'procurement_staff', 'accounts_staff'];

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  password: z.string().optional(),
  is_active: z.boolean().default(true),
});
type UserFormValues = z.infer<typeof userSchema>;

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '', email: '', role: 'site_engineer', phone: '', password: '', is_active: true
    }
  });

  const pwdForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' }
  });

  useEffect(() => { fetchData(); }, [page, search, roleFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters: Record<string, any> = {};
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (statusFilter !== 'all') filters.is_active = statusFilter === 'active';
      
      const { data: r } = await userService.getAll({ page, limit: 12, search, ...filters });
      if (r.success) { setData(r.data); setPagination(r.pagination); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    form.reset({ name: '', email: '', role: 'site_engineer', phone: '', password: '', is_active: true });
    setModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    form.reset({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      password: '',
      is_active: u.is_active
    });
    setModal(true);
  };

  const openPwd = (u: User) => {
    setEditing(u);
    pwdForm.reset({ password: '' });
    setPwdModal(true);
  };

  const onSubmit = async (values: UserFormValues) => {
    if (!editing && (!values.password || values.password.length < 6)) {
      form.setError('password', { message: 'Password must be at least 6 characters for new users' });
      return;
    }
    
    setSaving(true);
    try {
      const payload = { ...values };
      if (editing && !payload.password) {
        delete payload.password;
      }
      
      const { data: r } = editing 
        ? await userService.update(editing.id, payload) 
        : await userService.create(payload);
        
      if (r.success) { 
        toast.success(editing ? 'User updated' : 'User created'); 
        setModal(false); 
        fetchData(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error saving user'); 
    } finally {
      setSaving(false);
    }
  };

  const onPwdSubmit = async (values: PasswordFormValues) => {
    if (!editing) return;
    setSaving(true);
    try {
      const { data: r } = await userService.resetPassword(editing.id, { password: values.password });
      if (r.success) { toast.success('Password reset successfully'); setPwdModal(false); }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error resetting password'); 
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-gray-500">{pagination?.total ?? 0} users in total</p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> New User
        </Button>
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 items-center justify-between bg-muted/20">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
                placeholder="Search users..." 
                className="pl-9 bg-background/50"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} className="shrink-0 bg-background/50">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shadow-sm border border-primary/20">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{row.name}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20">
                        {ROLE_LABELS[row.role as keyof typeof ROLE_LABELS] || row.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.phone || '—'}</TableCell>
                    <TableCell>
                      {row.is_active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {row.last_login ? fmtDateTime(row.last_login) : 'Never'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openPwd(row)} className="h-8 w-8 text-muted-foreground hover:text-amber-500">
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {pagination && pagination.total > 0 && (
          <div className="p-4 border-t border-border/50 bg-muted/10">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'New User'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editing ? 'New Password' : 'Password *'}</FormLabel>
                    <FormControl><Input type="password" placeholder="Min 6 chars" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {editing && (
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4 mt-4 bg-muted/20">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Account</FormLabel>
                      <p className="text-sm text-muted-foreground">User can log in and access the system.</p>
                    </div>
                  </FormItem>
                )} />
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
                  {saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={pwdModal} onOpenChange={setPwdModal}>
        <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-sm text-muted-foreground">
            Reset password for <strong>{editing?.name}</strong>.
          </div>
          <Form {...pwdForm}>
            <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} className="space-y-4">
              <FormField control={pwdForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password *</FormLabel>
                  <FormControl><Input type="password" placeholder="Min 6 chars" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setPwdModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {saving ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
