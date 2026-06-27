import { useState, useEffect } from 'react';
import { User, Lock, Save, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { fmtDateTime, ROLE_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirm: z.string().min(1, 'Confirm password is required'),
}).refine(data => data.newPassword === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user, fetchMe } = useAuth();
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirm: '',
    }
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const { data } = await userService.updateProfile(values);
      if (data.success) { 
        toast.success('Profile updated'); 
        fetchMe(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error updating profile'); 
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setSaving(true);
    try {
      const { data } = await userService.changePassword({ 
        currentPassword: values.currentPassword, 
        newPassword: values.newPassword 
      });
      if (data.success) { 
        toast.success('Password changed'); 
        passwordForm.reset(); 
      }
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Error changing password'); 
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* Avatar + Role Card */}
      <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary text-3xl font-bold shadow-inner border border-primary/20">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-xl font-bold text-foreground">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}
            </Badge>
            {user?.is_active ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Inactive</Badge>
            )}
          </div>
        </div>
        <div className="sm:ml-auto text-center sm:text-right text-sm">
          <div className="text-muted-foreground mb-1">Last login</div>
          <div className="font-medium text-foreground bg-muted/50 py-1 px-3 rounded-md">
            {user?.last_login ? fmtDateTime(user.last_login) : 'N/A'}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" /> Profile Info
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Lock className="w-4 h-4 mr-2" /> Change Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal details here.</p>
            </div>
            
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={profileForm.control} name="name" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input value={user?.email || ''} readOnly disabled className="bg-muted opacity-70" /></FormControl>
                    <FormDescription>Email cannot be changed here. Contact admin.</FormDescription>
                  </FormItem>

                  <FormField control={profileForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="+91 XXXXX XXXXX" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormItem className="md:col-span-2">
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input value={ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role || ''} readOnly disabled className="bg-muted opacity-70 max-w-sm" />
                    </FormControl>
                  </FormItem>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/50">
                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <div className="glass-card bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl p-6 shadow-sm max-w-xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
              <p className="text-sm text-muted-foreground">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl><Input type="password" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Min 6 characters" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={passwordForm.control} name="confirm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input type="password" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end pt-4 mt-6 border-t border-border/50">
                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
                    <Lock className="w-4 h-4 mr-2" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
