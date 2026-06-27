import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Eye, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { purchaseService } from '../../services/purchaseService';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, fmtCurrency, getStatusColor, getStatusLabel } from '../../utils/helpers';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';

import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

interface PurchaseOrderItem {
  id: number;
  material_name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  supplier_phone: string;
  order_date: string;
  expected_delivery: string;
  project_name?: string;
  site_name?: string;
  item_count: number;
  total_amount: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  payment_status: string;
  created_by_name: string;
  approved_by_name?: string;
  notes?: string;
  items?: PurchaseOrderItem[];
}

export default function PurchaseOrderList() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, search, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: r } = await purchaseService.getAll({ page, limit: 12, search, ...filters });
      if (r.success) {
        setData(r.data);
        setPagination(r.pagination);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openView = async (id: number) => {
    try {
      const { data: r } = await purchaseService.getOne(id);
      if (r.success) {
        setSelected(r.data);
        setViewModal(true);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error fetching details');
    }
  };

  const openStatus = (po: PurchaseOrder, status: string) => {
    setSelected(po);
    setNewStatus(status);
    setStatusNotes('');
    setStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { data: r } = await purchaseService.updateStatus(selected.id, { status: newStatus, notes: statusNotes });
      if (r.success) {
        toast.success(r.message || 'Status updated');
        setStatusModal(false);
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error updating status');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, po_number: string) => {
    if (!window.confirm(`Delete PO ${po_number}? This cannot be undone.`)) return;
    try {
      const { data: r } = await purchaseService.remove(id);
      if (r.success) {
        toast.success('Purchase order deleted');
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error deleting PO');
    }
  };

  const getStatusActions = (row: PurchaseOrder): string[] => {
    const map: Record<string, string[]> = {
      draft: ['pending_approval', 'cancelled'],
      pending_approval: ['approved', 'cancelled'],
      approved: ['ordered', 'cancelled'],
      ordered: ['received', 'cancelled'],
      partially_received: ['received'],
    };
    return map[row.status] || [];
  };

  const statusLabels: Record<string, string> = {
    pending_approval: 'Submit for Approval',
    approved: 'Approve',
    ordered: 'Mark Ordered',
    received: 'Mark Received',
    partially_received: 'Partial Receive',
    cancelled: 'Cancel',
  };

  const statusBtnClass = (s: string) => s === 'cancelled'
    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
    : 'bg-primary/10 text-primary hover:bg-primary/20';

  const filterDefs = [
    { key: 'status', label: 'Status', type: 'select', options: ['draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'].map(s => ({ value: s, label: getStatusLabel(s) })) },
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date', label: 'To Date', type: 'date' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-xl p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart size={22} className="text-primary" /> Purchase Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination?.total ?? 0} total orders</p>
        </div>
        {hasRole('admin', 'procurement_staff', 'project_manager') && (
          <Link to="/purchase-orders/new">
            <Button className="gap-2"><Plus size={16} /> New PO</Button>
          </Link>
        )}
      </div>

      <div className="glass-card bg-background/80 backdrop-blur-xl rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <SearchFilter
            value={search}
            onChange={(v: string) => { setSearch(v); setPage(1); }}
            placeholder="Search PO number, supplier…"
            filters={filterDefs}
            filterValues={filters}
            onFilterChange={(k: string, v: any) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); }}
          />
          <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
            <RefreshCw size={14} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project / Site</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No purchase orders found</TableCell></TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-primary">{row.po_number}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{row.supplier_name}</div>
                      <div className="text-xs text-muted-foreground">{row.supplier_phone}</div>
                    </TableCell>
                    <TableCell>{fmtDate(row.order_date)}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{row.project_name || '—'}</div>
                        <div className="text-muted-foreground">{row.site_name || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">{row.item_count} items</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{fmtCurrency(row.total_amount)}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(row.status)}>{getStatusLabel(row.status)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={getStatusColor(row.payment_status)}>{getStatusLabel(row.payment_status)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openView(row.id)} title="View">
                          <Eye size={14} />
                        </Button>
                        {getStatusActions(row).map(s => (
                          <Button key={s} variant="ghost" size="sm" onClick={() => openStatus(row, s)} className={`h-7 px-2 text-xs ${statusBtnClass(s)}`}>
                            {statusLabels[s]}
                          </Button>
                        ))}
                        {['draft', 'cancelled'].includes(row.status) && hasRole('admin', 'procurement_staff') && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(row.id, row.po_number)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* View Modal */}
      <Dialog open={viewModal} onOpenChange={setViewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>PO Details — {selected?.po_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Supplier:</span><span className="font-medium">{selected.supplier_name}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Order Date:</span><span>{fmtDate(selected.order_date)}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Expected:</span><span>{fmtDate(selected.expected_delivery) || '—'}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Status:</span><span className={getStatusColor(selected.status)}>{getStatusLabel(selected.status)}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Project:</span><span>{selected.project_name || '—'}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Site:</span><span>{selected.site_name || '—'}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Created by:</span><span>{selected.created_by_name}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-32">Approved by:</span><span>{selected.approved_by_name || '—'}</span></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Order Items</h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selected.items || []).map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.material_name}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{fmtCurrency(item.unit_price)}</TableCell>
                          <TableCell className="font-semibold text-right">{fmtCurrency(item.total_price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="bg-muted/30 p-3 text-right border-t flex justify-end gap-4">
                    <span className="font-bold">Total Amount:</span>
                    <span className="font-bold text-primary">{fmtCurrency(selected.total_amount)}</span>
                  </div>
                </div>
              </div>
              {selected.notes && <div className="text-sm"><span className="text-muted-foreground font-semibold">Notes: </span>{selected.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <Dialog open={statusModal} onOpenChange={setStatusModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update PO Status → {getStatusLabel(newStatus)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Update <strong>{selected?.po_number}</strong> status to <strong>{getStatusLabel(newStatus)}</strong>?
              {newStatus === 'received' && <span className="block text-green-600 mt-2 font-medium">⚡ This will automatically update site inventory.</span>}
              {newStatus === 'cancelled' && <span className="block text-destructive mt-2 font-medium">⚠️ This action cannot be undone.</span>}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea rows={3} value={statusNotes} onChange={e => setStatusNotes(e.target.value)} placeholder="Add any notes regarding this status change..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={saving}>
              {saving ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
