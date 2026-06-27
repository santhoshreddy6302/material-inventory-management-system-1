import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const fmtDate = (d: string | Date | null | undefined, fmt: string = 'dd MMM yyyy'): string => {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : d, fmt); }
  catch { return String(d); }
};

export const fmtDateTime = (d: string | Date | null | undefined): string => fmtDate(d, 'dd MMM yyyy, HH:mm');
export const fmtDateInput = (d: string | Date | null | undefined): string => fmtDate(d, 'yyyy-MM-dd');
export const timeAgo = (d: string | Date | null | undefined): string => {
  if (!d) return '—';
  try { return formatDistanceToNow(typeof d === 'string' ? parseISO(d) : d, { addSuffix: true }); }
  catch { return String(d); }
};

export const fmtCurrency = (n: number | string | null | undefined, symbol: string = '₹'): string => {
  if (n === null || n === undefined) return '—';
  return `${symbol}${parseFloat(String(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtNumber = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return '—';
  return parseFloat(String(n)).toLocaleString('en-IN', { maximumFractionDigits: 3 });
};

export const fmtLargeNumber = (n: number | string | null | undefined): string => {
  if (!n) return '₹0';
  const v = parseFloat(String(n));
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(2)}`;
};

export const getStatusColor = (status: string | null | undefined): string => {
  if (!status) return 'badge-gray';
  const map: Record<string, string> = {
    active: 'badge-green', planning: 'badge-blue', completed: 'badge-gray',
    on_hold: 'badge-yellow', cancelled: 'badge-red',
    draft: 'badge-gray', pending_approval: 'badge-yellow', approved: 'badge-blue',
    ordered: 'badge-blue', partially_received: 'badge-orange', received: 'badge-green',
    in_stock: 'badge-green', low_stock: 'badge-yellow', out_of_stock: 'badge-red',
    pending: 'badge-yellow', paid: 'badge-green', partial: 'badge-orange',
    in_transit: 'badge-blue', high: 'badge-red', critical: 'badge-red',
    medium: 'badge-yellow', low: 'badge-blue',
  };
  return map[status] || 'badge-gray';
};

export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '—';
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
};

export const ROLES = {
  ADMIN:            'admin',
  PROJECT_MANAGER:  'project_manager',
  SITE_ENGINEER:    'site_engineer',
  PROCUREMENT:      'procurement_staff',
  ACCOUNTS:         'accounts_staff',
};

export const ROLE_LABELS: Record<string, string> = {
  admin:            'Administrator',
  project_manager:  'Project Manager',
  site_engineer:    'Site Engineer',
  procurement_staff:'Procurement Staff',
  accounts_staff:   'Accounts Staff',
};
