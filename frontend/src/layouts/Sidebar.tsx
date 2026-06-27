import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Wrench, Trash2,
  FolderKanban, MapPin, Truck, FileBarChart, Bell, Users, ArrowLeftRight,
  HardHat, ChevronDown, ChevronRight, DollarSign, MessageSquare, Target,
  Briefcase, Settings, BarChart
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/materials', icon: Package, label: 'Materials' },
  {
    label: 'Inventory', icon: Warehouse, children: [
      { to: '/inventory',  label: 'Stock Overview' },
      { to: '/transfers',  label: 'Stock Transfers' },
    ]
  },
  { to: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
  { to: '/usage',    icon: Wrench, label: 'Material Usage' },
  { to: '/wastage',  icon: Trash2, label: 'Wastage Records' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/sites',    icon: MapPin,        label: 'Sites' },
  { to: '/suppliers',icon: Truck,         label: 'Suppliers' },
  { to: '/labour',         icon: Users,         label: 'Labour' },
  { to: '/expenses',       icon: DollarSign,    label: 'Expenses' },
  { to: '/enquiries',      icon: MessageSquare, label: 'Enquiries' },
  { to: '/milestones',     icon: Target,        label: 'Milestones' },
  { to: '/subcontractors', icon: Briefcase,     label: 'Subcontractors' },
  { to: '/machinery',      icon: Settings,      label: 'Machinery' },
  { to: '/progress',       icon: BarChart,      label: 'Progress' },
  { to: '/reports',  icon: FileBarChart,  label: 'Reports' },
  { to: '/alerts',   icon: Bell,          label: 'Alerts' },
];

function NavGroup({ item, onClose }: { item: any, onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        <span className="flex items-center gap-3">
          <Icon size={18} className="stroke-[1.5]" />
          <span>{item.label}</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="pl-9 pr-3 flex flex-col gap-1 border-l border-border/50 ml-4">
          {item.children.map((child: any) => (
            <NavLink
              key={child.to} to={child.to}
              onClick={onClose}
              className={({ isActive }) => `px-3 py-2 rounded-md text-sm transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { user, isAdmin } = useAuth() as any;

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 flex flex-col
        glass border-r border-border/50
        transform transition-all duration-300 ease-spring
        ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-border/50 bg-gradient-to-br from-background/50 to-muted/30">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 animate-float">
            <HardHat size={22} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground truncate w-40" title="AVINASH KANAPARTHI">AVINASH KANAPARTHI</div>
            <div className="text-[9px] uppercase tracking-widest font-semibold text-primary truncate w-40" title="INFRA PRIVATE LIMITED">INFRA PRIVATE LIMITED</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {navItems.map(item =>
            item.children
              ? <NavGroup key={item.label} item={item} onClose={onClose} />
              : (
                <NavLink
                  key={item.to} to={item.to}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                >
                  <item.icon size={18} className="stroke-[1.5]" />
                  <span>{item.label}</span>
                </NavLink>
              )
          )}
          {isAdmin && isAdmin() && (
            <div className="pt-4 mt-4 border-t border-border/50">
              <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin</div>
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
              >
                <Users size={18} className="stroke-[1.5]" />
                <span>User Management</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border/50 bg-muted/20 backdrop-blur-md">
          <NavLink to="/profile" onClick={onClose} className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-accent transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{user?.name}</div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {user?.role?.replace(/_/g, ' ')}
              </div>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
