import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, LogOut, User, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { alertService } from '../services/alertService';
import { timeAgo, getStatusColor } from '../utils/helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';

export default function Navbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout } = useAuth() as any;
  const { dark, toggle } = useTheme() as any;
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlertCount = async () => {
    try {
      const { data } = await alertService.getUnreadCount();
      if (data.success) setAlertCount(data.data.count);
    } catch {}
  };

  const fetchAlerts = async () => {
    try {
      const { data } = await alertService.getAll({ limit: 5, is_read: false, is_resolved: false });
      if (data.success) setAlerts(data.data);
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getSeverityColor = (s: string) => ({
    critical: 'text-destructive', high: 'text-orange-500', medium: 'text-yellow-500', low: 'text-blue-500'
  }[s] || 'text-muted-foreground');

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50 h-16 flex items-center px-4 lg:px-8 gap-4 shadow-sm backdrop-blur-2xl transition-all">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full text-muted-foreground hover:text-foreground">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <DropdownMenu onOpenChange={(open) => open && fetchAlerts()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-card">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {alertCount > 0 && <span className="text-xs font-normal text-muted-foreground">{alertCount} unread</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto py-1">
              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-muted-foreground/30" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                alerts.map(a => (
                  <DropdownMenuItem key={a.id} className="p-3 cursor-pointer items-start gap-3 rounded-none border-b border-border/50 last:border-0 focus:bg-primary/5">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getSeverityColor(a.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</div>
                      <div className="text-[10px] font-medium text-muted-foreground/60 mt-1">{timeAgo(a.created_at)}</div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="p-2 justify-center cursor-pointer text-primary focus:text-primary font-medium">
              <Link to="/alerts">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 pl-2 pr-3 rounded-full flex items-center gap-2 hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7 border border-border shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-semibold">{user?.name?.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card">
            <div className="px-2 py-2.5">
              <p className="text-sm font-bold leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize leading-none">{user?.role?.replace(/_/g,' ')}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/profile"><User className="w-4 h-4 mr-2" /> My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
