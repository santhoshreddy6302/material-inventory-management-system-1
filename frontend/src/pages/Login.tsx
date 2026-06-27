import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardHat, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Login() {
  const { login } = useAuth() as any;
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e: any) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      const ok = await login(form.email, form.password);
      if (!ok) setError('Invalid credentials. Please try again.');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (email: string) => setForm({ email, password: 'Admin@123' });

  return (
    <div className="min-h-screen flex bg-gradient-mesh relative selection:bg-primary/30 animate-fade-in">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl -z-10" />

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden text-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background z-0" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-primary/20 border border-primary/20">
            <HardHat size={28} className="text-primary" />
          </div>
          <div>
            <div className="font-black text-xl tracking-tight leading-tight">AVINASH KANAPARTHI INFRA</div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest mt-0.5">PRIVATE LIMITED</div>
          </div>
        </div>

        <div className="z-10 max-w-xl">
          <h1 className="text-5xl font-black mb-6 leading-tight tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Material Inventory<br />Management System
          </h1>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-medium">
            Track, manage, and optimize construction material flow across all your sites in real-time with our enterprise-grade ERP.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Materials Tracked', value: '50+' },
              { label: 'Active Projects',   value: '10+' },
              { label: 'Sites Managed',     value: '25+' },
              { label: 'Purchase Orders',   value: '100+' },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-5 border border-border/50 hover:bg-background/80 transition-colors">
                <div className="text-3xl font-black text-primary mb-1">{s.value}</div>
                <div className="text-sm font-semibold text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs font-medium text-muted-foreground z-10">© 2024 AVINASH KANAPARTHI INFRA PRIVATE LIMITED</div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 lg:max-w-[500px] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm border-l border-border/50 z-10">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden flex-col items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <HardHat size={28} className="text-primary-foreground" />
            </div>
            <div className="text-center">
              <div className="font-black text-xl text-foreground">AVINASH KANAPARTHI INFRA</div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">PRIVATE LIMITED</div>
            </div>
          </div>

          <Card className="border-border/50 shadow-2xl glass-card bg-card/80">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-black tracking-tight">Sign in</CardTitle>
              <CardDescription className="text-sm font-medium">
                Enter your credentials to access the ERP
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 animate-fade-in border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email" 
                      name="email" 
                      value={form.email} 
                      onChange={handleChange}
                      placeholder="you@company.com" 
                      required 
                      autoComplete="email" 
                      autoFocus
                      className="pl-9 h-11 bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'} 
                      name="password" 
                      value={form.password} 
                      onChange={handleChange}
                      placeholder="••••••••" 
                      required 
                      autoComplete="current-password"
                      className="pl-9 pr-9 h-11 bg-background/50 focus:bg-background transition-colors"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-bold shadow-md shadow-primary/20">
                  {loading ? (
                    <><span className="animate-spin mr-2 rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />Signing in…</>
                  ) : 'Sign In'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col border-t border-border/50 pt-6">
              <p className="text-xs font-semibold text-muted-foreground text-center mb-4 uppercase tracking-wider">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2 w-full">
                {[
                  { label: 'Admin',      email: 'admin@constco.com' },
                  { label: 'PM',         email: 'pm@constco.com' },
                  { label: 'Engineer',   email: 'engineer@constco.com' },
                  { label: 'Procurement',email: 'procurement@constco.com' },
                ].map(d => (
                  <Button 
                    key={d.label} 
                    variant="outline" 
                    size="sm"
                    onClick={() => demoLogin(d.email)}
                    className="h-9 text-xs font-semibold border-border/50 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground text-center mt-4">Password: Admin@123</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
